#!/usr/bin/env node

import inquirer from 'inquirer';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import simpleGit from 'simple-git';

const git = simpleGit();
const templateRepo = 'https://github.com/chernikovichAndrey/react-native-project-template';

async function run() {
  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'projectName',
      message: 'Enter the project name:',
      validate: input => input ? true : 'Project name cannot be empty'
    },
    {
      type: 'checkbox',
      name: 'libraries',
      message: 'Select libraries to install:',
      choices: [
        { name: 'react-navigation', value: 'react-navigation' },
        { name: 'react-native-gesture-handler', value: 'react-native-gesture-handler' },
        { name: 'axios', value: 'axios' },
        { name: 'redux', value: 'redux' },
        { name: 'react-redux', value: 'react-redux' }
      ]
    }
  ]);

  const { projectName, libraries } = answers;
  const targetPath = path.join(process.cwd(), projectName);

  // Clone template repository
  console.log('Cloning template repository...');
  await git.clone(templateRepo, targetPath);

  // Remove .git directory to detach from the template repo
  console.log('Removing .git directory...');
  fs.rmdirSync(path.join(targetPath, '.git'), { recursive: true });

  // Install dependencies
  console.log('Installing dependencies...');
  execSync(`cd ${targetPath} && npm install`, { stdio: 'inherit' });

  // Install selected libraries
  if (libraries.length > 0) {
    const librariesToInstall = libraries.join(' ');
    console.log(`Installing selected libraries: ${librariesToInstall}`);
    execSync(`cd ${targetPath} && npm install ${librariesToInstall}`, { stdio: 'inherit' });
  }

  // Initialize a new git repository
  console.log('Initializing new git repository...');
  await git.cwd(targetPath);
  await git.init();
  await git.add('.');
  await git.commit('Initial commit');

  console.log('Project setup complete!');
}

run().catch(err => {
  console.error('Error:', err);
});
