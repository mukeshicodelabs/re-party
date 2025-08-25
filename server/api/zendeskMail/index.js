const axios = require("axios")
async function notifyAdmin(req,res) {
  const zendeskUrl = `https://${process.env.ZENDESK_SUBDOMAIN}.zendesk.com/api/v2/tickets.json`;
  const {listingId, title, transactionId = "", name} =req.body
console.log(req.body,"req");
let ticketData
if(transactionId && name){
 ticketData = {
    ticket: {
      subject: `Dispute Raises - Please Verify`,
      comment: {
        body: `transaction dispute has been raised.\n\nTransaction ID: ${transactionId}\nName: ${name}}`
      },
      priority: "normal"
    }
  }
}else{
   ticketData = {
    ticket: {
      subject: `New Listing Published - Please Verify`,
      comment: {
        body: `A new listing has been published.\n\nListing ID: ${listingId}\nTitle: ${title}}`
      },
      priority: "normal"
    }
  };}

  try {
    const response = await axios.post(zendeskUrl, ticketData, {
      auth: {
        username: `${process.env.ZENDESK_EMAIL}/token`,
        password: process.env.ZENDESK_API_TOKEN
      }
    });
    console.log("✅ Ticket created successfully:", response.data.ticket.id);
    return res.status(200).json({ message: "Ticket created successfully" });


  } catch (error) {
    console.error("❌ Failed to create Zendesk ticket:", error.response?.data || error.message);
    return res.status(400).json({ message: "Ticket not created", error: error.message });
  }
}
module.exports = {
  notifyAdmin
}