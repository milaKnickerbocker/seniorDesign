// Topic names from the interface contract.
// If the contract changes (for example, adding a droneId level), update them here only.
module.exports = {
  TELEMETRY: 'home/drone/telemetry', // drone -> backend
  DETECTION: 'home/drone/alert', // drone -> backend
  COMMAND: 'home/dashboard/command', // backend -> drone (not used yet)
};