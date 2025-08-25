import { useState, useRef } from 'react';

function useStateRef(initialValue) {
  const [state, setState] = useState(initialValue);
  const ref = useRef(state);

  const setValue = value => {
    setState(value);
    ref.current = value;
  };
  
  return [state, setValue, ref];
}

export default useStateRef;
