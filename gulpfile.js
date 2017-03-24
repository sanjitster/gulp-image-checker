var gulp = require('gulp'),
    clean = require('gulp-clean'),
    rename = require("gulp-rename"),
    plumber = require('gulp-plumber'),
    fs = require('fs-extra'),
    parallel = require("concurrent-transform"),
    os = require("os"),
    gm = require('gulp-gm'),
    sniff = require('gulp-sniff'),
    gulpIgnore = require('gulp-ignore'),
    download = require('gulp-downloader'),
    csv2json = require('gulp-csv-to-json');

// Configuration 
var config = JSON.parse(fs.readFileSync('config.json'));

// Convert CSV file to JSon
gulp.task('csvToJson', function () {
    var options = {
        processValue: function (key, value) {
            return value;
        }
    };
    console.log(config.csvFile);
    return gulp
        .src(config.csvFile)
        .pipe(csv2json(options))
        .pipe(gulp.dest(config.directory.sourceDir));
});

// Download file from URL and store into source folder
gulp.task('import', ['csvToJson'], function () {
    var json = JSON.parse(fs.readFileSync(config.directory.sourceDir + '/' + config.jsonFileName + '.json'));
    var build = [];
    for (var j in json) {
        if (json.hasOwnProperty(j)) {
            if (typeof json[j] === "object") {
                var ij = json[j];
                for (var inner in ij) {
                    build.push({
                        fileName: j + '.' + ij[inner].split('.').pop(),
                        request: {
                            url: ij[inner]
                        }
                    });
                }
            } else {
                build.push({
                    fileName: j + '.' + json[j].split('.').pop(),
                    request: {
                        url: json[j]
                    }
                });
            }
        }
    }

    return download(build)
        .pipe(plumber())
        .pipe(rename(function (path) {
            console.log(path);
            var str = path.basename;
            path.basename = str.toLowerCase().replace(/[\. ,:-\\']+/g, "_");
        }))
        .pipe(gulp.dest(config.directory.sourceDir));
});

// Delete the validated directory
gulp.task('clean-valid', function () {
    return gulp.src([
            config.directory.validDir + '/*.{' + config.validFiletypes.toString() + ',' + config.workingFiletypes.toString() + '}'
        ], {
            read: false
        })
        .pipe(clean({
            force: true
        })).on('end', function () {
            fs.remove(config.directory.validDir + 'data/filelist.json', function (err) {
                if (err !== null) {
                    console.error(err);
                }
            });
        });
});

// Delete the invalid directory
gulp.task('clean-invalid', function () {
    return gulp.src([config.directory.invalidDir + '**/*'], {
            read: false
        })
        .pipe(clean({
            force: true
        }));
});

// Delete the resized directory
gulp.task('clean-resize', function () {
    return gulp.src([
            config.directory.resizeDir + '/*.' + config.imgConvert.resizeFormat
        ], {
            read: false
        })
        .pipe(clean({
            force: true
        })).on('end', function () {
            fs.remove(config.directory.resizeDir + 'data/filelist.json', function (err) {
                if (err !== null) {
                    console.error(err);
                }
            });
        });
});

// Delete the resized directory
gulp.task('clean-workingfiles', function () {
    return gulp.src([config.directory.workDir + '**/*'], {
            read: false
        })
        .pipe(clean({
            force: true
        }));
});

// Default to clean both validated and invaild folders
gulp.task('clean', ['clean-valid', 'clean-invalid', 'clean-resize', 'clean-workingfiles']);

// Get all invalid filetypes
gulp.task('invalid', ['clean-invalid'], function () {
    return gulp.src([
            config.directory.sourceDir + '/**',
            '!' + config.directory.sourceDir + '/*.{' + config.validFiletypes.toString() + ',' + config.workingFiletypes.toString() + '}'
        ])
        .pipe(plumber())
        .pipe(gulp.dest(config.directory.invalidDir));
});

// Get all working filetypes
gulp.task('workingfiles', ['clean-workingfiles'], function () {
    return gulp.src([
            config.directory.sourceDir + '/*.{' + config.workingFiletypes.toString() + '}'
        ])
        .pipe(plumber())
        .pipe(rename(function (path) {
            var str = path.basename;
            path.basename = str.toLowerCase().replace(/[\. ,:-\\']+/g, "_");
        }))
        .pipe(gulp.dest(config.directory.workDir));
});

// Get all validated filetypes
gulp.task('valid', ['clean-valid'], function () {
    return gulp.src([
            config.directory.sourceDir + '/*.{' + config.validFiletypes.toString() + '}'
        ])
        .pipe(plumber())
        .pipe(parallel(
            gm(function (gmfile, done) {
                gmfile.identify(function (err, identify) {
                    if (!err) {
                        var imgFormat = gmfile.data.format.toLowerCase();
                        switch (imgFormat) {
                            case 'jpeg':
                            case 'jpg':
                                var imgF = 'jpg';
                                break;
                            default:
                                var imgF = 'png';
                        }
                        done(null,
                            gmfile
                            .strip()
                            .setFormat(imgF)
                        );
                    } else {
                        console.log(err);
                    }
                });
            }),
            os.cpus().length
        ))
        .pipe(rename(function (path) {
            var str = path.basename;
            path.basename = str.toLowerCase().replace(/[\. ,:-\\']+/g, "_");
        }))
        .pipe(sniff("image"))
        .pipe(gulp.dest(config.directory.validDir));
});

// Get the list of filenames in json
gulp.task('validfilenames', function () {
    return gulp.src([
            config.directory.validDir + '/*.{' + config.validFiletypes.toString() + '}'
        ], {
            passthrough: true
        })
        .pipe(plumber())
        .pipe(sniff("filename"))
        .pipe(gulpIgnore.exclude(true))
        .pipe(gulp.dest(config.directory.validDir + 'data/')).on('end', function () {
            fs.outputJson(config.directory.validDir + 'data/filelist.json', sniff.get("filename"), {
                spaces: 3
            }, function (err) {
                if (err !== null) {
                    console.error(err);
                }
            });
        });
});

// Build image resize and convert to desired image format
gulp.task('resize', ['clean-resize'], function () {
    return gulp.src([
            config.directory.validDir + '/*.{' + config.validFiletypes.toString() + '}'
        ])
        .pipe(plumber())
        .pipe(parallel(
            gm(function (gmfile, done) {
                gmfile.identify(function (err, identify) {
                    if (!err) {
                        done(null,
                            gmfile
                            .resize(config.imgConvert.width, config.imgConvert.height, '!')
                            .setFormat(config.imgConvert.resizeFormat)
                        );
                    };
                });
            }),
            os.cpus().length
        ))
        .pipe(sniff("resized-filename"))
        .pipe(gulp.dest(config.directory.resizeDir)).on('end', function () {
            fs.outputJson(config.directory.resizeDir + 'data/filelist.json', sniff.get("resized-filename"), {
                spaces: 3
            }, function (err) {
                if (err !== null) {
                    console.error(err);
                }
            });
        });
});

// Configure the checker task
gulp.task('checker', ['workingfiles', 'invalid', 'valid']);

// create a default task and just log a message
gulp.task('default', ['checker']);