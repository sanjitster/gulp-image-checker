# Image Checker

[![devDependency Status](https://david-dm.org/sanjitster/gulp-image-checker/dev-status.svg)](https://david-dm.org/sanjitster/gulp-image-checker#info=devDependencies)

This project enables files dropped into /src folder to be organized into multipal folders. It also enables resizing and compression of valid image type to another image type specified in the config.json. Source folder will not be flushed be able to repeat the extraction process over again.:

- Gulp Taskers [Gulp](http://gulpjs.com/)
- GraphicsMagick for node.js [gm](http://aheckmann.github.io/gm/)

## Installation

Open the folder in your command line, and install the needed dependencies:

```bash
cd projectname
npm install
```

## Build Commands

Run `gulp` to trigger tasker to organize working files, invalid images and valid images.

Run `gulp validfilenames` to trigger tasker to generate a json list of filenames for the valid images. *output/valid/data*

Run `gulp resize` to trigger tasker to resize, compress and export to a image type. It also saves a json list of resized filenames. *out/resized*

Run `gulp clean` to trigger tasker to flush all files and folders in /output. Files in source folder will not be amended.


## Individual Build Commands

Run `gulp workingfiles` to trigger tasker to flush working files folder and re-extract working files from souce folder

Run `gulp invalid` to trigger tasker to flush invalid folder. It re-extracts invalid images and work files types from souce folder

Run `gulp valid` to trigger tasker to flush valid folder and re-extract valid images from souce folder


### Configuration (config.json)

```json
{
    "directory": {
        "sourceDir":    "src",
        "validDir":     "output/valid/",
        "invalidDir":   "output/invalid/",
        "resizeDir":    "output/resized/",
        "workDir":      "output/working_files/"
    },
    "validFiletypes": [
        "jpg",
        "png"
    ],
    "workingFiletypes": [
        "eps",
        "tif",
        "psd",
        "ai",
        "PNG",
        "JPEG"
    ],
    "imgConvert": {
        "width": 180,
        "height": 120,
        "resizeFormat": "png"
    }
}
```