import { CypressComponentProjectSchema } from './schema';
import {
  addDependenciesToPackageJson,
  formatFiles,
  generateFiles,
  joinPathFragments,
  offsetFromRoot,
  readProjectConfiguration,
  Tree,
  updateProjectConfiguration,
} from '@nrwl/devkit';
import { join } from 'path';
import {
  cypressReactVersion,
  cypressWebpackVersion,
  swcCoreVersion,
  swcLoaderVersion,
} from '../../utils/versions';

export async function cypressComponentProject(
  tree: Tree,
  options: CypressComponentProjectSchema
) {
  // TODO: normalize options

  // TODO verify cypress >10 is installed, if no cypress version install cypressVersion

  const projectConfig = readProjectConfiguration(tree, options.project);
  generateFiles(tree, join(__dirname, 'files'), projectConfig.root, {
    ...options,
    projectRoot: projectConfig.root,
    offsetFromRoot: offsetFromRoot(projectConfig.root),
    ext: '',
  });

  projectConfig.targets['test-cmp'] = {
    executor: '@nrwl/cypress:cypress',
    options: {
      cypressConfig: joinPathFragments(projectConfig.root, 'cypress.config.ts'),
      testingType: 'component',
    },
  };

  updateProjectConfiguration(tree, options.project, projectConfig);

  const devDeps = {
    '@nrwl/cypress': cypressReactVersion,
    '@nrwl/cypress-webpack': cypressWebpackVersion,
    '@cypress/webpack-dev-server': cypressWebpackVersion,
    'html-webpack-plugin': '^4.0.0',
  };

  if (options.componentType === 'react') {
    devDeps['@cypress/react'] = cypressReactVersion;
    if (options.compiler === 'swc') {
      devDeps['@swc/core'] = swcCoreVersion;
      devDeps['swc-loader'] = swcLoaderVersion;
    }
  }

  const installDeps = addDependenciesToPackageJson(tree, {}, devDeps);

  return () => {
    formatFiles(tree);
    installDeps();
  };
}
