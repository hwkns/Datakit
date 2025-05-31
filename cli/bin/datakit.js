#!/usr/bin/env node

const { Command } = require('commander');
const chalk = require('chalk');
const { startServer } = require('../lib/server');
const package = require('../package.json');

const program = new Command();

program
  .name('datakit')
  .description('DataKit - Modern web-based data analysis tool')
  .version(package.version);

program
  .command('serve')
  .alias('start')
  .description('Start DataKit server')
  .option('-p, --port <port>', 'specify port number')
  .option('--no-open', 'don\'t open browser automatically')
  .option('-h, --host <host>', 'specify host (default: localhost)', 'localhost')
  .action(async (options) => {
    try {
      console.log(chalk.blue('🚀 Starting DataKit...'));
      await startServer(options);
    } catch (error) {
      console.error(chalk.red('❌ Failed to start DataKit:'), error.message);
      process.exit(1);
    }
  });

program
  .command('open')
  .description('Start DataKit server and open in browser (default behavior)')
  .option('-p, --port <port>', 'specify port number')  
  .option('-h, --host <host>', 'specify host (default: localhost)', 'localhost')
  .action(async (options) => {
    try {
      console.log(chalk.blue('🚀 Starting DataKit...'));
      await startServer({ ...options, open: true });
    } catch (error) {
      console.error(chalk.red('❌ Failed to start DataKit:'), error.message);
      process.exit(1);
    }
  });

program
  .command('version')
  .alias('v')
  .description('Show DataKit version information')
  .action(() => {
    console.log('');
    console.log(chalk.blue('📦 DataKit CLI'));
    console.log(chalk.gray('Version: ') + chalk.green(package.version));
    console.log(chalk.gray('Homepage: ') + chalk.cyan('https://datakit.page'));
    console.log('');
    console.log(chalk.yellow('💡 Features:'));
    console.log(chalk.gray('  • Process CSV/JSON files up to 4-5GB'));
    console.log(chalk.gray('  • DuckDB-powered SQL engine'));
    console.log(chalk.gray('  • Complete data privacy (local processing)'));
    console.log(chalk.gray('  • Modern React-based interface'));
    console.log('');
  });

program
  .command('update')
  .description('Check for updates and update DataKit CLI')
  .action(async () => {
    const { checkForUpdates } = require('../lib/updater');
    try {
      await checkForUpdates();
    } catch (error) {
      console.error(chalk.red('❌ Failed to check for updates:'), error.message);
      process.exit(1);
    }
  });

program
  .command('info')
  .description('Show system and DataKit information')
  .action(() => {
    const os = require('os');
    const { getSystemInfo } = require('../lib/system');
    
    console.log('');
    console.log(chalk.blue('🔍 DataKit System Information'));
    console.log('');
    console.log(chalk.yellow('CLI Information:'));
    console.log(chalk.gray('  Version: ') + chalk.green(package.version));
    console.log(chalk.gray('  Install Path: ') + chalk.cyan(__dirname));
    console.log('');
    
    const systemInfo = getSystemInfo();
    console.log(chalk.yellow('System Information:'));
    console.log(chalk.gray('  Platform: ') + chalk.white(systemInfo.platform));
    console.log(chalk.gray('  Node.js: ') + chalk.white(systemInfo.nodeVersion));
    console.log(chalk.gray('  Memory: ') + chalk.white(systemInfo.memory));
    console.log(chalk.gray('  CPU: ') + chalk.white(systemInfo.cpu));
    console.log('');
    
    console.log(chalk.yellow('💡 Recommended for optimal performance:'));
    console.log(chalk.gray('  • Node.js 16+ for better performance'));
    console.log(chalk.gray('  • 8GB+ RAM for large file processing'));
    console.log(chalk.gray('  • Modern browser (Chrome/Firefox/Safari/Edge)'));
    console.log('');
  });

// Default command when no subcommand is provided
program
  .action(async () => {
    try {
      console.log(chalk.blue('🚀 Starting DataKit...'));
      await startServer({ open: true });
    } catch (error) {
      console.error(chalk.red('❌ Failed to start DataKit:'), error.message);
      process.exit(1);
    }
  });

program.parse();