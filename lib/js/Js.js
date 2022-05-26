
/**
* Js 文件工具类。
*/
define('Js', function (require, module, exports) {
    const UglifyJS = require('uglify-es'); //https://github.com/mishoo/UglifyJS2/tree/harmony
    const console = require('@webpart/console');
    const $String = require('@definejs/string');
    const $Object = require('@definejs/object');
    const Query = require('@definejs/query');
    const File = require('@definejs/file');
    const MD5 = require('@definejs/md5');

    const Lines = require('Lines');
    const Props = module.require('Props');
    const defaults = require(`${module.id}.defaults`);


    return exports = {
        /**
        * 合并 js 文件列表。
        *   list = [file, { file } ];
        *
        *   opt = {
        *       begin: '' || [],    //可选，闭包的头文件。
        *       end: '' || [],      //可选，闭包的尾文件。
        *       dest: '',           //可选，要写入的目标文件。
        *       each: fn,           //可选，要对每个 js 文件内容进行处理转换的函数。
        *                           //each(file, content); 如果返回字符串，则使用新结果作为 content。
        *   };
        */
        concat(list = [], opt = {}) {
            if (!list || !list.length) {
                return {
                    'content': '',
                    'files': [],
                    'dest': '',
                    'md5': 'D41D8CD98F00B204E9800998ECF8427E', //空字符串的。
                };
            }

            let { begin, end, dest, each, } = opt;
            let contents = [];
            let files = [];

            begin = Array.isArray(begin) ? begin : [begin];
            end = Array.isArray(end) ? end : [end];
            each = each || function () { };

            list = [
                ...begin,
                ...list,
                ...end,
            ];

            list.forEach((item) => {
                if (!item) {
                    return;
                }

                let file = typeof item == 'object' ? item.file : item;
                let content = File.read(file);
                let content2 = each(file, content);

                if (typeof content2 == 'string') {
                    content = content2;
                }

                contents.push(content);
                files.push(file);
            });

            console.log('合并'.bgGreen, files.length.toString().cyan, '个文件:');
            console.log('    ' + files.join('\r\n    ').gray);

            contents = Lines.join(contents);

            let md5 = MD5.get(contents);

            //写入合并后的 js 文件。
            if (dest) {
                dest = $String.format(dest, { 'md5': md5, });
                File.write(dest);
            }

            return {
                'content': contents,
                'files': files,
                'dest': dest,
                'md5': md5,
            };

        },


        /**
        * 压缩 js 文件。
        *   opt = {
        *       content: '',//输入的源文件内容。
        *       src: '',    //输入的源文件路径。 如果指定，则 content = File.read(src);
        *       dest: '',   //输出的目标文件路径。 如果指定，则写入目标文件。
        *       file: '',   //输入的源文件和输出的目标文件路径，如果指定，则 src = dest = file;
        *       done: fn,   //执行完后的回调函数。
        *   };
        */
        minify(opt) {
            let { content, src, dest, file, done, } = opt;
            let begin = new Date(); //计时。

            if (file) {
                src = dest = file;
            }

            if (src) {
                content = File.read(src);
            }

            let size = $String.getByteLength(content);
            size = size / 1024;
            size = Math.ceil(size).toString();
            console.log('开始压缩 js 内容', size.cyan, 'KB'.gray, '...');


            //直接从内容压缩，不读取文件
            let info = UglifyJS.minify(content);  //针对 es6。
            let code = info.code;
            let error = info.error;

            if (error) {
                console.error('js 压缩错误:', src);
                console.error(error);  //标红。

                Lines.highlight(content, error.line - 1);

                if (defaults.error) {
                    File.write(defaults.error, content);
                    console.error(`已把合并后、压缩前的内容写入到  ${defaults.error}，请根据错误提示进行检查。`);
                }

                console.log(error); //这个可以把堆栈信息打印出来。
                throw error;
            }

            let size2 = $String.getByteLength(code);
            size2 = size2 / 1024;
            size2 = Math.ceil(size2).toString();

            let percent = (size - size2) / size * 100;
            percent = percent.toFixed(2).toString();

            let time = new Date() - begin;
            time = time.toString();

            console.log(
                '成功压缩 js 内容', size2.cyan, 'KB'.gray,
                ' 压缩率', percent.cyan + '%'.gray,
                ' 耗时', time.cyan, 'ms'.gray
            );



            dest && File.write(dest, code); //写入压缩后的 js 文件。
            done && done(code);

            return code;
        },



        /**
        * 内联。
        * 把 js (或文件的)内容生成内联的 `<script> ... </script>`方式。
        *   opt = {
        *       content: '',    //js 内容。 如果不指定，则从 file 中读取。
        *       file: '',       //输入的源 css 文件路径。
        *       tabs: 0,        //缩进的空格数。
        *       props: {},      //其它属性。
        *       comment: '',    //是否添加注释。 如果指定为 true，则简单以 file 路径作为注释。
        *   };
        */
        inline(opt) {
            let file = opt.file;
            let comment = opt.comment;
            let content = opt.content || File.read(file);
            let props = Props.stringify(opt.props);

            if (comment === true) {
                comment = file || '';
            }

            if (comment) {
                comment = '/**' + comment + '*/';
            }

            content = comment ? [comment, content] : [content];
            content = Lines.stringify(content, 4);  //content 的内容先缩进一级。

            content = [
                '<script' + props + '>',
                content,
                '</script>',
            ];

            content = Lines.stringify(content, opt.tabs);

            return content;
        },

        /**
        * 混入。
        * 生成 `<script src="xx"></script>` 标签的 html。
        *   opt = {
        *       href: '',   //script 标签中的 src 属性。
        *       tabs: 0,    //缩进的空格数。
        *       props: {},  //其它属性。
        *       query: {},  //生成到 script 标签 src 属性里的 query 部分。 
        *   };
        */
        mix(opt = {}) {
            let { href, query, } = opt;
            let props = Props.stringify(opt.props);

            if (query && !$Object.isEmpty(query)) { //忽略空白对象 {}。
                href = Query.add(href, query);
            }

            let html = $String.format(defaults.sample, {
                'href': href,
                'props': props,
            });

            html = Lines.stringify(html, opt.tabs);

            return html;
        },

        /**
        * 构建。
        *   opt = {
        *       list: [],       //js 文件列表。
        *       begin: '',      //闭包的头片段文件路径。
        *       end: '',        //闭包的尾片段文件路径。
        *       tabs: 0,        //缩进的空格数。
        *       minify: false,  //是否压缩。
        *       inline: false,  //是否内容。
        *       dest: '',       //可选。 要写入的目标文件。
        *       href: '',       //
        *       props: {},      //
        *       query: {},      //生成到 script 标签 src 属性里的 query 部分。 
        *       transform: fn,  //可选。 合并完成后、压缩之前，要对 js 内容进行转码的函数(如 babel 转码)。
        *   };
        */
        build(opt) {
            let { list, dest, tabs, props, } = opt;
            let transform = opt.transform || function () { };


            //先合并。
            let concat = exports.concat(list, {
                'begin': opt.begin,
                'end': opt.end,
            });

            //再转码。

            let content = concat.content;
            let content2 = transform(content, concat);

            if (typeof content2 == 'string') {
                content = content2;
            }


            let md5 = concat.md5;

            //最后压缩。
            if (opt.minify) {
                content = exports.minify({ 'content': content, });
                md5 = MD5.get(content);
            }

            let html = '';

            if (opt.inline) {
                html = exports.inline({
                    'content': content,
                    'tabs': tabs,
                    'props': props,
                });
            }
            else {
                let href = $String.format(opt.href, { 'md5': md5, });

                html = exports.mix({
                    'href': href,
                    'tabs': tabs,
                    'props': props,
                    'query': opt.query,
                });
            }

            if (dest) {
                dest = $String.format(dest, { 'md5': md5, });
                File.write(dest, content);
            }

            return html;

        },
    };







});




