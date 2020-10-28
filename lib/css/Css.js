
/**
* Css 文件工具类。
*/
define('Css', function (require, module, exports) {
    const less = require('less');

    const $String = require('@definejs/string');
    const $Object = require('@definejs/object');
    const Query = require('@definejs/query');
    const File = require('@definejs/file');

    const Lines = require('Lines');

    const Props = module.require('Props');
    
    const defaults = require(`${module.id}.defaults`);


    return {
        /**
        * 压缩 css 文件。
        *   options = {
                content: '',    //输入的源文件内容。
                src: '',        //输入的源文件路径。 如果指定，则 content = File.read(src);
                dest: '',       //输出的目标文件路径。 如果指定，则写入目标文件。
                file: '',       //输入的源文件和输出的目标文件路径，如果指定，则 src = dest = file;
                done: fn,       //执行完后的回调函数。
            };
        */
        minify(options) {
            let { content, src, dest, file, done, } = options;

            if (file) {
                src = dest = file;
            }

            if (src) {
                content = File.read(src);
            }

            if (src) {
                console.log('压缩'.bgMagenta, src);
            }

            less.render(content, { 'compress': true, }, (error, output) => {
                if (error) {
                    console.error('css 压缩错误:', error.message);
                    src && console.log('所在文件: '.bgMagenta, src.bgMagenta);
                    console.log(error);
                    throw error;
                }


                let css = output.css;

                dest && File.write(dest, css);
                done && done(css);
            });
        },

        /**
        * 混入。
        * 生成 `<link rel="stylesheet" href="xx.css" />` 标签的 html。
        *   options = {
                tabs: 0,    //缩进的空格数。
                href: '',   //link 标签中的 href 属性。
                query: {},  //href 属性中的 query 部分。
                props: {},  //其它属性。
            };
        */
        mix(options = {}) {
            let href = options.href || '';
            let query = options.query;
            let props = Props.stringify(options.props);

            if (query && !$Object.isEmpty(query)) { //忽略空白对象 {}。
                href = Query.add(href, query);
            }


            let html = $String.format(defaults.sample, {
                'href': href,
                'props': props,
            });

            html = Lines.stringify(html, options.tabs);

            return html;
        },


        /**
        * 内联。
        * 把 css (或文件的)内容生成内联的 `<style> ... </style>`方式。
        *   options = {
                content: '',    //css 内容。 如果不指定，则从 file 中读取。
                file: '',       //输入的源 css 文件路径。
                tabs: 0,        //缩进的空格数。
                props: {},      //其它属性。
                comment: '',    //是否添加注释。 如果指定为 true，则简单以 file 路径作为注释。
            };
        */
        inline(options) {
            let file = options.file;
            let comment = options.comment;
            let content = options.content || File.read(file);
            let props = Props.stringify(options.props);

            if (comment === true) {
                comment = file || '';
            }

            if (comment) {
                comment = '/**' + comment + '*/';
            }

            content = comment ? [comment, content] : [content];
            content = Lines.stringify(content, 4);  //content 的内容先缩进一级。

            content = [
                '<style' + props + '>',
                content,
                '</style>',
            ];

            content = Lines.stringify(content, options.tabs);

            return content;
        },
    };







});




