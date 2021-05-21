
/**
* 
*/
define('WebSite/Resource', function (require, module, exports) {
    const console = require('@webpart/console');
    const File = require('@definejs/file');
    const Patterns = require('@definejs/patterns');
    const Directory = require('@definejs/directory');
    
    const Log = require('Log');


    function clear(desc, cwd, patterns) {
        if (!patterns) {
            return;
        }

        let dirs = [];
        let files = [];

        patterns.forEach((item) => {
            if (item.startsWith('!') || item.includes('*') || !item.endsWith('/')) {
                files.push(item);
            }
            else {
                dirs.push(cwd + item);
            }
        });

        files = Patterns.getFiles(cwd, files);


        if (dirs.length > 0) {
            Directory.delete(dirs);
            Log.seperate();
            console.log(desc.bgMagenta, dirs.length.toString().cyan, '个目录:');
            Log.logArray(dirs, 'gray');
        }

        if (files.length > 0) {
            File.delete(files);
            Log.seperate();
            console.log(desc.bgMagenta, files.length.toString().cyan, '个文件:');
            Log.logArray(files, 'gray');
        }
    }



    return {

        /**

        */
        init(meta) {
            let htdocs = meta.htdocs;
            let cwd = meta.cwd;
            let css = cwd + meta.css;

            console.log('删除目录'.bgYellow, cwd.yellow);
            Directory.delete(cwd);

            console.log('复制目录'.bgMagenta, htdocs.green, '→', cwd.cyan);
            Directory.copy(htdocs, cwd);

            //先删除自动生成的目录，后续会再生成回来。
            Directory.delete(css);


        },



        /**
        * dir: 网站根目录。
        * key$fn: 处理规则映射表，是一个 { key: fn ,} 的集合。
        *
        */
        process(dir, key$fn) {
            console.log('开始进行 process ...');

            key$fn = key$fn || {};

            let deletes = [];   //收集被删除的文件列表。
            let converts = [];  //收集被转换了内容的文件列表。


            //key 可能是一个路径模式，如 `**/*.js`。
            Object.keys(key$fn).forEach((key) => {
                let fn = key$fn[key];
                let files = Patterns.getFiles(dir, key);

                files.forEach((file) => {
                    let content = File.read(file);
                    let value = fn(file, content, require);

                    if (value === content) {
                        return;
                    }

                    if (value === null) { //只有明确返回 null 才删除。
                        File.delete(file);
                        deletes.push(file);
                    }
                    else {
                        File.write(file, value, null);
                        converts.push(file);
                    }
                });
            });

            if (deletes.length > 0) {
                console.log('删除了', deletes.length.toString().cyan, '个文件:');
                Log.logArray(deletes, 'gray');
            }

            if (converts.length > 0) {
                console.log('转换了', converts.length.toString().cyan, '个文件:');
                Log.logArray(converts, 'gray');
            }

        },

        /**
        * 排除。
        */
        exclude(cwd, patterns) {
            clear('排除', cwd, patterns);
        },

        /**
        * 清理。
        */
        clean(cwd, patterns) {
            clear('清理', cwd, patterns);


            //递归删除空目录
            console.log('开始递归清理空目录...');

            let dirs = Directory.trim(cwd);
            let count = dirs.length.toString();

            Log.seperate();
            console.log('清理'.bgMagenta, count.cyan, '个空目录:');
            Log.logArray(dirs, 'gray');
        },

    };




});




