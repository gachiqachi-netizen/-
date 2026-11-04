// Copy to config.local.js (gitignored). Replace the placeholder with your
// computer's reachable LAN backend URL; this is an address, not a credential.
module.exports = {
  apiBase: 'http://YOUR_COMPUTER_LAN_HOST:8801',
  // modelBase defaults to apiBase + '/models'.
  modelVersion: 'v1'
}
