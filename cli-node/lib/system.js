const os = require('os');

function formatBytes(bytes) {
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  if (bytes === 0) return '0 Bytes';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
}

function getSystemInfo() {
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;
  
  return {
    platform: `${os.type()} ${os.release()} (${os.arch()})`,
    nodeVersion: process.version,
    memory: `${formatBytes(usedMem)} / ${formatBytes(totalMem)} used`,
    cpu: `${os.cpus()[0].model} (${os.cpus().length} cores)`,
    uptime: Math.floor(os.uptime() / 3600) + ' hours',
    loadAverage: os.loadavg().map(load => load.toFixed(2)).join(', ')
  };
}

module.exports = { getSystemInfo };