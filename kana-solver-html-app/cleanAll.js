const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const rimraf = promisify(require('rimraf'));

(async () => {
    await rimraf(path.join(process.cwd(), "dist"));
    await rimraf(path.join(process.cwd(), "generatedCopySrc"));
    await rimraf(path.join(process.cwd(), "src/generated"));
})(); 