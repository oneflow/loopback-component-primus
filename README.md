# node-kickstart
A standardised project to let OneFlow developers quickly kickstart a new Node.js project

This setup includes
- Sample class with sync and async code
- Unit tests for class
- Eslint and editorconfig configuration
- CircleCI build configuration
- Docker build configuration
- NPM configuration 

It includes some developer conventions:
- Eslint based on Airbnb with a few overrides (thus, runs on codeclimate)
- Editorconfig to match eslint 
- Wallaby configuration for continuous testing

## Run, Testing, Coverage

To start:
```
npm start
```

To test:
```
npm test
```

To run coverage:
```
npm run cover
```

## Building

This can build on CircleCI. The `circle.yml` script includes everything necessary. 
The only exception is that you need to set up the CircleCI SSH key to enable write access
to your github repository. 

More info can be found in the [Oneflow's Wiki](https://oneflow.atlassian.net/wiki/display/DEV/CircleCI)

Environment variables required:
- CODECOV_TOKEN: to enable pushing coverage to codecov.io
- NPM_TOKEN: to enable use of private @oneflow npms, and publishing to npm
- DOCKER_USER: to push a docker image
- DOCKER_PASS: to push a docker image
- DOCKER_EMAIL: to push a docker image

## QA WebTools

You may want to setup the different QA WebTools that we are using at OneFlow. 

Visit the [OneFlow's Wiki](https://oneflow.atlassian.net/wiki/display/DEV/QA+webtools) to find out more about those tools.
