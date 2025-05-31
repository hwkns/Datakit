const express = require('express');
const path = require('path');
const open = require('open');
const getPort = require('get-port');
const chalk = require('chalk');

async function startServer(options = {}) {
  const {
    port: requestedPort,
    host = 'localhost',
    open: shouldOpen = true
  } = options;

  // Find available port
  const port = await getPort({
    port: requestedPort ? parseInt(requestedPort) : getPort.makeRange(3000, 3100)
  });

  const app = express();
  

  const distPath = path.join(__dirname, '../dist');
  app.use(express.static(distPath));

  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });

  app.use((err, req, res, next) => {
    console.error(chalk.red('Server error:'), err);
    res.status(500).send('Internal Server Error');
  });

  return new Promise((resolve, reject) => {
    const server = app.listen(port, host, () => {
      const url = `http://${host}:${port}`;
      
      console.log('');
      console.log(chalk.green('✅ DataKit is running!'));
      console.log('');
      console.log(chalk.cyan('  Local:   ') + chalk.white(url));
      if (host === 'localhost') {
        console.log(chalk.cyan('  Network: ') + chalk.white(`http://0.0.0.0:${port}`));
      }
      console.log('');
      console.log(chalk.gray('  Press Ctrl+C to stop the server'));
      console.log('');

      if (shouldOpen) {
        console.log(chalk.blue('🌐 Opening browser...'));
        open(url).catch(err => {
          console.log(chalk.yellow('⚠️  Could not open browser automatically'));
          console.log(chalk.gray('  Please navigate to the URL above manually'));
        });
      }

      // Handle graceful shutdown
      process.on('SIGINT', () => {
        console.log('\n' + chalk.yellow('🛑 Shutting down DataKit...'));
        server.close(() => {
          console.log(chalk.green('✅ DataKit stopped successfully'));
          process.exit(0);
        });
      });

      resolve({ server, port, host, url });
    });

    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        reject(new Error(`Port ${port} is already in use. Try a different port with --port option.`));
      } else {
        reject(err);
      }
    });
  });
}

module.exports = { startServer };