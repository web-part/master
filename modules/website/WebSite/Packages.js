

define('WebSite/Packages', function (require, module, exports) {
    const console = require('@webpart/console');
    const Directory = require('@definejs/directory');
    const File = require('@definejs/file');

    const PackageBlock = require('PackageBlock');
    const Log = require('Log');



    return {
        /**
        * 
        */
        init(meta) {
            if (!meta.packages) {
                return;
            }

            let dest = meta.packages.dest;
            let dir = meta.cwd + dest.dir;      //分包资源打包后的输出目录。
            let file = meta.cwd + dest.file;    //总包配置文件的输出路径。

            //先清空，避免使用者意外用到。
            Directory.clear(dir);

            //写入空的总包文件。
            File.writeJSON(file, {});

        },

        /**
        * 解析。
        */
        parse(meta) {
            let options = meta.packages || {};
            let { enabled, patterns, dest, } = options;

            if (!enabled || !patterns || !patterns.length) {
                return null;
            }


            let block = new PackageBlock({
                'htdocs': meta.cwd,
                'css': meta.css,
                'patterns': patterns,
                'dest': dest,
            });

            block.on('compile', {
                'html-block': function (...args) {
                    let values = meta.emitter.fire('package', 'compile', 'html-block', args);
                    return values.slice(-1)[0];
                },
                'js-block': function (...args) {
                    let values = meta.emitter.fire('package', 'compile', 'js-block', args);
                    return values.slice(-1)[0];
                },
            });

            let files = block.parse();
            let count = files.length;

            if (count > 0) {
                console.log('匹配到'.bgGreen, count.toString().cyan, '个包文件:');
                Log.logArray(files, 'magenta');
            }

            return block;
        },
        

        /**
        * 编译所有包文件，完成后开启监控。
        *   config = {
        *       options: {
        *           disabled: false,    //是否禁用打包功能。
        *           minify: false,      //是否压缩。
        *           name: '{name}',     //输出的文件名，支持 `{name}`: 当前的包名、`{md5}`: 内容的 md5 值两个模板字段。
        *           query: {},          //生成到 href 中的 query 部分。
        *       };
        *       change: function(infos),    //
        *       done: function(infos),      //
        *   };
        */
        watch(meta, config) {
            let block = meta.PackageBlock;
            let options = config.options;
            let done = config.done;

            if (!block || !options) {
                return done();
            }

            //启用打包功能。
            let minify = options.minify;
            let change = config.change;

            block.on('change', function () {
                this.compile({
                    'minify': minify,
                    'name': options.name,
                    'query': options.query,

                    'done'() {
                        this.write({ 'minify': minify, });
                        change();
                    },
                });
            });

            //模式发生了改变。
            block.on('change', 'patterns', function (type$patterns) {
                meta.MasterBlock.set('excludes', type$patterns);
            });



            block.on('compile', 'each', {
                'before': function (item) {
                    Log.seperate();
                    console.log('>> 开始打包'.cyan, item.file);
                },

                'done': function (item) {
                    console.log('<< 完成打包'.green, item.file);
                },
            });

            block.compile({
                'minify': minify,
                'name': options.name,
                'query': options.query,

                'done': function () {
                    this.write({ 'minify': minify, });
                    block.watch();  //开启监控。
                    done();
                },
            });

        },

        /**
        * 构建。
        *   config = {
        *       options : {
        *           minify: true,       //是否压缩。
        *           name: '{md5}',      //输出的文件名，支持 `{name}`: 当前的包名、`{md5}`: 内容的 md5 值两个模板字段。
        *           begin: '',          //可选。 合并 js 的闭包头文件。
        *           end: '',            //可选。 合并 js 的闭包的尾文件。
        *           query: {},          //生成到 href 中的 query 部分。 
        *       },
        *       done: fn,               //构建完成后要执行的回调函数。
        *   };
        */
        build(meta, config) {
            let block = meta.PackageBlock;
            let options = config.options;
            let done = config.done;

            if (!block || !options) {
                return done();
            }

            let { cwd, } = meta;
            let { minify, begin, end, } = options;

            //短路径补全。
            begin = begin ? `${cwd}${begin}` : '';
            end = end ? `${cwd}${end}` : '';


            block.on('compile', 'each', {
                'before': function (item) {
                    Log.seperate();
                    console.log('>> 开始打包'.cyan, item.file);
                },

                'done': function (item) {
                    console.log('<< 完成打包'.green, item.file);
                },
            });

            block.compile({
                'minify': minify,
                'name': options.name,
                'begin': begin,
                'end': end,
                'query': options.query,

                'done': function () {
                    this.write({ 'minify': minify, });
                    done();
                },
            });

        },



    };

});




