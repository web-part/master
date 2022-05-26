
/**
* 动态（批量）引用 js 资源文件。
* 事件：
*   ('change');
*   ('render', 'js-link');
*/
define('JsBlock', function (require, module, exports) {
    const Emitter = require('@definejs/emitter');
    const $String = require('@definejs/string');
    const File = require('@definejs/file');
    const MD5 = require('@definejs/md5');

    const Lines = require('Lines');
    const Js = require('Js');

    const Meta = module.require('Meta');
    const Parser = module.require('Parser');
    const Watcher = module.require('Watcher');

    const mapper = new Map();

    class JsBlock {
        /**
        * 构造器。
        *   config = {
        *       dir: '',        //必选，路径模式中的相对目录，即要解析的页面所在的目录。 如 `htdocs/html/test/`。
        *       patterns: [],   //必选，路径模式列表。
        *       excludes: [],   //可选，要排除的模式列表。 里面包含完整的目录，与字段 dir 无关。
        *       delay: 0,       //可选，需要延迟触发 change 事件的毫秒数。 指定该参数，可以让一定时间内的多个 change 合并成一次来触发。
        *   };
        */
        constructor(config) {
            config = Object.assign({}, config);

            let emitter = new Emitter(this);

            let meta = Meta.create(config, {
                'this': this,
                'emitter': emitter,
            });

            mapper.set(this, meta);

            Object.assign(this, {
                'id': meta.id,
                'data': {},         //用户自定义数据容器。
            });
        }

        data = {};

        /**
        * 重置为初始状态，为新一轮的解析做准备。
        */
        reset() {
            let meta = mapper.get(this);
            Meta.reset(meta);
        }

        /**
        * 解析。
        *   opt = {
        *       error: function(file),      //文件不存时要执行的函数。
        *   };
        */
        parse(opt) {
            let meta = mapper.get(this);
            meta.list = Parser.parse(meta, opt);
        }

        /**
        * 设置特定的字段。
        */
        set(key, value) {
            let meta = mapper.get(this);

            switch (key) {
                case 'excludes':
                    let excludes = value || [];
                    let changed = JSON.stringify(excludes) != JSON.stringify(meta.excludes);

                    if (changed) {
                        meta.excludes = excludes.slice(0);
                        meta.this.reset();
                        meta.this.parse();
                        meta.this.watch();
                        meta.change();
                    }

                    break;
            }
        }

        /**
        * 渲染生成 html。
        *   opt = {
        *       inline: false,      //是否内联。
        *       tabs: 0,            //缩进的空格数。
        *       md5: 4,             //添加到 href 中 query 部分的 md5 的长度。
        *       query: {} || fn,    //添加到 href 中 query 部分。
        *       props: {},          //生成到标签中的其它属性。
        *   };
        */
        render(opt = {}) {
            let meta = mapper.get(this);

            meta.list.forEach((item, index) => {

                let html = item.link.render({
                    'href': item.href,
                    'tabs': opt.tabs,
                    'inline': opt.inline,
                    'md5': opt.md5,
                    'query': opt.query,
                    'props': opt.props,
                });

                meta.contents[index] = html;
            });

            let html = Lines.join(meta.contents);

            return html;

        }

        /**
        * 监控当前引用文件和下级列表的变化。
        */
        watch() {
            let meta = mapper.get(this);

            meta.watcher = meta.watcher || Watcher.create(meta);

            meta.list.forEach((item, index) => {
                if (item.isOld) { //复用过来的，不需要重新绑定。
                    return;
                }

                let link = item.link;

                link.on('change', function () {
                    meta.change(true);
                });

                link.watch();
            });

        }

        /**
        * 合并文件列表。
        *   opt = {
        *       begin: '',      //可选，闭包的头文件。
        *       end: '',        //可选，闭包的尾文件。
        *       dest: '',       //可选，要写入的目标文件。 支持 `{md5}` 模板字段。
        *       minify: false,  //可选，是否压缩。
        *       each: fn,       //可选，在合并前，要对每个 js 文件内容进行处理转换的函数。
        *       transform: fn,  //可选。 合并完成后、压缩之前，要对 js 内容进行转换的函数(如 babel 转码)。
        *   };
        */
        concat(opt = {}) {
            let dest = opt.dest || '';
            let transform = opt.transform || function () { };
            let meta = mapper.get(this);

            let list = meta.list.map((item) => {
                return item.file;
            });

            //先合并。
            let concat = Js.concat(list, {
                'begin': opt.begin,
                'end': opt.end,
                'each': opt.each,
            });

            let content = concat.content;
            let content2 = transform(content, concat);

            if (typeof content2 == 'string') {
                content = content2;
            }

            let md5 = concat.md5;


            //再压缩。
            if (content && opt.minify) {
                content = Js.minify({ 'content': content, });
                md5 = MD5.get(content);
            }

            //写入合并后的 js 文件。
            if (dest) {
                dest = $String.format(dest, { 'md5': md5, });
                File.write(dest);
            }

            return {
                'content': content,
                'md5': md5,
                'dest': dest,
                'minify': opt.minify,
                'list': list,
            };
        }

        /**
        * 构建。
        *   opt = {
        *       tabs: 0,        //缩进空格数。
        *       begin: '',      //闭包的头片段文件路径。
        *       end: '',        //闭包的尾片段文件路径。
        *       minify: false,  //是否压缩。
        *       inline: false,  //是否内联。
        *       name: '',       //要写入目标文件名。 如果指定则写入，否则忽略。
        *       props: {},      //生成到 script 标签中其它属性。
        *       query: {},      //生成到 script 标签 src 属性里的 query 部分。 
        *       transform: fn,  //可选。 合并完成后、压缩之前，要对 js 内容进行转码的函数(如 babel 转码)。
        *   };
        */
        build(opt) {
            opt = opt || {};

            let meta = mapper.get(this);
            let href = '';
            let dest = '';
            let name = opt.name;

            if (name) {
                href = name;
                dest = meta.dir + name;
            }


            let html = Js.build({
                'list': meta.list,
                'begin': opt.begin,
                'end': opt.end,
                'tabs': opt.tabs,
                'minify': opt.minify,
                'inline': opt.inline,
                'props': opt.props,
                'query': opt.query,
                'dest': dest,
                'href': href,
                'transform': opt.transform,
            });

            return html;
        }

        /**
        * 绑定事件。
        */
        on(...args) {
            let meta = mapper.get(this);
            meta.emitter.on(...args);
        }


        /**
        * 销毁当前对象。
        */
        destroy() {
            let meta = mapper.get(this);
            if (!meta) { //已销毁。
                return;
            }

            meta.list.forEach((item) => {
                item.link.destroy();
            });

            meta.emitter.destroy();
            meta.watcher && meta.watcher.destroy();
            mapper.delete(this);
        }

        /**
        * 从当取实例中提取尽量多的 json 信息。
        * @param {object} [opt] 可选的配置参数。
        *   opt = {
        *       tabs: 0,            //缩进的空格数。
        *       md5: 4,             //添加到 href 中 query 部分的 md5 的长度。
        *   }; 
        * @returns 
        */
        toJSON(opt) {
            let meta = mapper.get(this);
            let list = Parser.toJSON(meta.list, opt);
            let html = opt ? this.render(opt) : undefined;

            let json = {
                'type': module.id,
                'id': meta.id,
                'dir': meta.dir,
                'patterns': meta.patterns,
                'excludes': meta.excludes,
                'render': html,
                'list': list,
            };

            return json;
        }

    }



    return JsBlock;


});




