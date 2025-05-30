const { execSync } = require('child_process');
const chalk = require('chalk');
const package = require('../package.json');

async function checkForUpdates() {
  console.log(chalk.blue('🔍 Checking for updates...'));
  
  try {
    // Check latest version from npm
    const latestVersion = execSync(`npm view ${package.name} version`, { 
      encoding: 'utf8' 
    }).trim();
    
    const currentVersion = package.version;
    
    console.log('');
    console.log(chalk.gray('Current version: ') + chalk.yellow(currentVersion));
    console.log(chalk.gray('Latest version:  ') + chalk.green(latestVersion));
    console.log('');
    
    if (currentVersion === latestVersion) {
      console.log(chalk.green('✅ You are using the latest version!'));
      console.log('');
      return;
    }
    
    // Offer to update
    console.log(chalk.yellow('🆕 A new version is available!'));
    console.log('');
    console.log(chalk.blue('To update, run:'));
    console.log(chalk.cyan(`  npm install -g ${package.name}@latest`));
    console.log('');
    
    // Show what's new (if we have release notes)
    console.log(chalk.gray('📝 For release notes, visit:'));
    console.log(chalk.cyan(`  ${package.homepage}/releases`));
    console.log('');
    
  } catch (error) {
    if (error.message.includes('404')) {
      console.log(chalk.yellow('⚠️  Could not find package on npm registry'));
      console.log(chalk.gray('This might be a local development version'));
    } else {
      console.log(chalk.red('❌ Failed to check for updates'));
      console.log(chalk.gray('Please check your internet connection'));
    }
    console.log('');
  }
}

module.exports = { checkForUpdates };