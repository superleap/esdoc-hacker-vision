import Promise from 'bluebird';
import childProcess from 'child_process';
import gulp from 'gulp';
import gulpLoadPlugins from 'gulp-load-plugins';
import path from 'path';
import readPackage from 'read-package-json';

let exec = childProcess.exec;
let pkg = Promise.promisify(readPackage);

const gp = gulpLoadPlugins();
const paths = {
    "pkg": "./package.json",
    "src": "./src/**/*.js",
    "compile": "./lib"
};

/**
 * Promisified child_process.exec
 * @param cmd
 * @param {Object} [opts={}] See child_process.exec node docs
 * @property {stream.Writable} [opts.stdout=process.stdout] - If defined, child process stdout will be piped to it.
 * @property {stream.Writable} [opts.stderr=process.stderr] - If defined, child process stderr will be piped to it.
 * @returns {Promise<{ stdout: string, stderr: stderr }>}
 */
function execp(cmd, opts = {}) {
    return new Promise((resolve, reject) => {
        const child = exec(cmd, opts,
            (err, stdout, stderr) => {
                return err ? reject(err) : resolve({
                    "stdout": stdout,
                    "stderr": stderr
                });
            });

        if (opts.stdout) {
            child.stdout.pipe(opts.stdout);
        }
        if (opts.stderr) {
            child.stderr.pipe(opts.stderr);
        }
    });
}

gulp.task(`lint`, () => {
    return gulp.src([`**/*.js`, `!node_modules/**`])
        .pipe(gp.excludeGitignore())
        .pipe(gp.eslint())
        .pipe(gp.eslint.format())
        .pipe(gp.eslint.failAfterError());
});

gulp.task(`nsp`, (cb) => {
    return gp.nsp({"package": path.resolve(`package.json`)}, cb);
});

gulp.task(`bithound`, () => {
    if (`true` !== process.env.CI_LATEST || `false` !== process.env.TRAVIS_PULL_REQUEST) {
        return false;
    }

    return pkg(paths.pkg, console.log, true).then((data) => {
        let pkgName = data.name;
        let pkgUser = data.repository.url.match(/github\.com\/([^\/]+)\//i)[1];

        return execp(`node_modules/.bin/bithound check git@github.com:${pkgUser}/${pkgName}.git`);
    });
});

gulp.task(`package`, () => {
    return pkg(paths.pkg, console.log, true).then((data) => {
        return gulp.src(paths.src)
            .pipe(gp.babel(data.babel))
            .pipe(gulp.dest(paths.compile));
    });
});

gulp.task(`prepublish`, [`nsp`, `bithound`, `package`]);
gulp.task(`default`, [`prepublish`, `lint`]);
