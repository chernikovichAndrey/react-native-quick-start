#!/usr/bin/env node

import inquirer from 'inquirer';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import simpleGit from 'simple-git';

const git = simpleGit();
const templateRepo = 'https://github.com/chernikovichAndrey/react-native-project-template';

async function promptUser() {
  return inquirer.prompt([
    {
      type: 'input',
      name: 'projectName',
      message: 'Enter the project name:',
      validate: input => input ? true : 'Project name cannot be empty'
    },
    {
      type: 'input',
      name: 'applicationId',
      message: 'Enter the application ID (e.g., com.example.app):',
      validate: input => /^[a-zA-Z0-9._]+$/.test(input) ? true : 'Application ID can only contain letters, numbers, dots, and underscores, and cannot be empty'
    },
    {
      type: 'checkbox',
      name: 'libraries',
      message: 'Select libraries to install:',
      choices: [
        { name: 'axios', value: 'axios' },
        { name: 'redux', value: 'redux' },
        { name: 'zustand', value: 'zustand' },
        { name: 'mobx', value: 'mobx' },
        { name: 'react-native-reanimated', value: 'react-native-reanimated' },
        { name: 'react-native-mmkv', value: 'react-native-mmkv' },
        { name: '@shopify/flash-list', value: '@shopify/flash-list' },
      ]
    },
    {
      type: 'list',
      name: 'packageManager',
      message: 'Choose a package manager:',
      choices: ['npm', 'yarn'],
      default: 'npm'
    },
    {
      type: 'confirm',
      name: 'isInstallPods',
      message: 'Do you want to install CocoaPods for iOS?',
      default: true
    }
  ]);
}

async function cloneTemplate(targetPath) {
  console.log('Cloning template repository...');
  await git.clone(templateRepo, targetPath);
  console.log('Removing .git directory...');
  fs.rmSync(path.join(targetPath, '.git'), { recursive: true });
}

async function renameProject(targetPath, projectName, applicationId) {
  console.log('Renaming project...');
  try {
    execSync(`cd ${targetPath} && npx react-native-rename@latest "${projectName}" -b "${applicationId}"`, {
      stdio: 'inherit'
    });
  } catch (error) {
    console.error('Failed to rename project:', error);
    process.exit(1);
  }
}

function installDependencies(targetPath, packageManager, libraries) {
  const installCommand = packageManager === 'yarn' ? 'yarn' : 'npm install';
  console.log('Installing dependencies...');
  execSync(`cd ${targetPath} && ${installCommand}`, { stdio: 'inherit' });

  if (libraries.length > 0) {
    const librariesToInstall = libraries.join(' ');
    console.log(`Installing selected libraries: ${librariesToInstall}`);
    execSync(`cd ${targetPath} && ${packageManager} add ${librariesToInstall}`, { stdio: 'inherit' });
  }
}

function installPods(targetPath) {
  console.log('Installing CocoaPods...');
  execSync(`cd ${path.join(targetPath, 'ios')} && pod install`, { stdio: 'inherit' });
}

async function initializeGitRepo(targetPath) {
  console.log('Initializing new git repository...');
  await git.cwd(targetPath);
  await git.init();
  await git.add('.');
  await git.commit('Initial commit');
}

async function run() {
  try {
    const answers = await promptUser();
    const { projectName, applicationId, libraries, packageManager, isInstallPods } = answers;
    const targetPath = path.join(process.cwd(), projectName);

    await cloneTemplate(targetPath);
    await renameProject(targetPath, projectName, applicationId);
    installDependencies(targetPath, packageManager, libraries);

    if (isInstallPods) {
      installPods(targetPath);
    }

    await initializeGitRepo(targetPath);

    console.log('Project setup complete!');
  } catch (err) {
    console.error('Error:', err);
  }
}

run();
