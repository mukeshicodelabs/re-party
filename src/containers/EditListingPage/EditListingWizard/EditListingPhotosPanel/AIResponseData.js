import React, { useMemo } from 'react';
import { Button, H3 } from '../../../../components';
import { base64ToFile } from '../../../../util/helper';
import { FormattedMessage } from '../../../../util/reactIntl';
import css from './EditListingPhotosForm.module.css';
import BrandIconCard from '../../../../components/BrandIconCard/BrandIconCard';
import { useState } from 'react';

const AIResponseData = React.memo(props => {
  const {
    aiImage,
    aiImageError,
    aiImageInProgress,
    setIsModalOpen,
    onCreateAiImage,
    handleImageUpload,
    prompts,
    setSelectedPrompt,
    numberOfAiImageCreation,
    selectedPrompt,  
  } = props;
  
  const [usedPrompts, setUsedPrompts] = useState([]);
  const aiResponseImage = useMemo(() => {
    try {
      return aiImage?.imageData?.base64_images[0]
        ? base64ToFile(aiImage.imageData.base64_images[0], `${Date.now()}_img.png`, 'image/png')
        : null;
    } catch (error) {
      console.error('Error in base64ToFile:', error);
      return null;
    }
  }, [aiImage?.imageData?.base64_images[0]]);

  const uploadAiImage = async () => {
    if (aiResponseImage) {
      try {
        await handleImageUpload('', aiResponseImage);
      } catch (error) {
        console.error('Error uploading AI image:', error);
      }
    }
  };
 
// Function to select a different prompt
const selectDifferentPrompt = currentPrompt => {
  if (!prompts || prompts.length <= 1) return prompts[0]?.prompt || currentPrompt; 
  // Filter out used prompts
  let availablePrompts = prompts.filter(p => !usedPrompts.includes(p.prompt) && p.prompt !== currentPrompt);

  // If all prompts have been used, reset usedPrompts except the current one
  if (availablePrompts.length === 0) {
    setUsedPrompts([currentPrompt]);
    availablePrompts = prompts.filter(p => p.prompt !== currentPrompt);
  }

  // Select a random prompt from the remaining
  const randomIndex = Math.floor(Math.random() * availablePrompts.length);
  const newPrompt = availablePrompts[randomIndex]?.prompt || currentPrompt;

  // Update used prompts
  setUsedPrompts(prev => [...prev, newPrompt]);

  return newPrompt;
};

// Handle Regenerate
const handleRegenerate = () => {
  const newPrompt = selectDifferentPrompt(selectedPrompt);
  setSelectedPrompt(newPrompt);
  onCreateAiImage(true, newPrompt);
};

  return (
    <div className={css.aiResponseData}>
      <h2 className={css.aiGeneratedDataTitle}>
        <FormattedMessage id="EditListingDetailsForm.aiGeneratedDataTitle" /> 🎉
      </h2>
      <div className={css.aiGeneratedDataSubTitle}>
        You bring the decor, we bring the magic. Let’s see what we created together.
      </div>
      {aiImageInProgress ? (
        <div>Loading...</div>
      ) : (
        <div className={css.aiMainContent}>
          {aiResponseImage && (
            <img
              src={URL.createObjectURL(aiResponseImage)}
              alt="AI Driven Image"
              width={200}
              className={css.aiImage}
            />
          )}
           <p className={css.aiGeneratedDataTitle}>
                    You can generate AI-enhanced images only 3 times throughout your entire journey
                    and you have used {numberOfAiImageCreation}.
                  </p>  
          <div className={css.continueWithAi}>
            <Button
              type="button"
              onClick={handleRegenerate}
              disabled={aiImageInProgress || prompts.length <= 1 || numberOfAiImageCreation >= 3}
              className={css.continueWithManual}
            >
              <BrandIconCard type="aiStarIcon" />
              Generate Again
            </Button>
            <Button
              type="button"
              onClick={() => {
                uploadAiImage();
                setIsModalOpen(false);
              }}
              disabled={aiImageInProgress}
              className={css.submitAiImage}
            >
              <FormattedMessage id="EditListingDetailsForm.continueWithAi" />
            </Button>
            <Button className={css.cancelButton} type="button" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}
      {aiImageError && (
        <div style={{ color: 'red', marginTop: '16px' }}>
          Error loading AI data: {aiImageError.message || 'Something went wrong.'}
        </div>
      )}
    </div>
  );
});

export default AIResponseData;