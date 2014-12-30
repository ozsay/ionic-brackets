# ionic-brackets

**ionic-brackets** is a **[Brackets](http://brackets.io/)** extension for developing mobile applications using **[Ionic](http://ionicframework.com/)** framework.

## Table of contents
- [Installation](#installation)
- [How To Use](#how-to-use)
- [Features](#features)
 - [Start an Ionic project](#start-an-ionic-project)
 - [Add Platform](#add-platform)
 - [Add Plugin](#add-plugin)
 - [Build](#build)
 - [Emulate](#emulate)
 - [Run](#run) 
 - [Live Development / Serve](#live-development-serve)
 - [Plugins hook](#plugins-hook)
 - [Add ngCordova](#add-ngcordova)
 - [Quick Docs](#quick-docs)
- [Contributing](#contributing)
- [Links](#links)
 
## Installation

The extension can be installed by following the instructions on the [official extensions guide](https://github.com/adobe/brackets/wiki/Brackets-Extensions).


## How To Use

If you can see the Ionic icon on the right toolbar, the extension is ready to use.
Simply locate the ionic menu on the menus-bar and continue from there.

| Note: The icon's color is turned light blue when running a background job (build, serve, etc.).

## Features

### Start an Ionic project
Creates an Ionic project using the available templates.

| Note: The extension understands if your project is an Ionic project by the existence of the `www` directory.

### Add platform
Adds a platform to the project [Choosing between ios or android].

### Add plugin
Adds a plugin to the project.

### Build
Builds the project.

### Emulate
Creates an emulator for the application using the android/ios tools.

### Run
Runs the application on a real device using the android/ios tools.

### Live Development / Serve
Runs your application inside Brackets.
You can open/close the live development view using the Ionic icon on the right side of Brackets.

| Note that plugins are currently not available. Intend for basic application UI/navigation testing.

### Plugins hook
Creates a Cordova hook for automatic plugins installation. Automatically adds your installed plugins to the hook.

### Add ngCordova
Adds ngCordova to your project:
1. Installs ngCordova using bower.
2. adds `<script src="lib/ngCordova/dist/ng-cordova.js"></script>` to the main `index.html` file.
3. adds a dependency to the main `app.js` file - example: `angular.module('myApp', ['ngCordova'])`.

### Quick docs
While developing, you can see the official docs of ngCordova plugins using quick docs key binding (defaulting to `ctrl+k`).


## Contributing

Feel free to contribute to the project by adding features or fixing bugs.

## Links

- Brackets - http://brackets.io/
- Ionic Framework - http://ionicframework.com/
- ngCordova - http://ngcordova.com/

## License

ionic-brackets is licensed under the MIT Open Source license. For more information, see the LICENSE file in this repository.
