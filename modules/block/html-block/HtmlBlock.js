
/**
* 动态引用 html 资源文件。
*/
define('HtmlBlock', function (require, module, exports) {
    const console = require('@webpart/console');
    const Emitter = require('@definejs/emitter');
    const $String = require('@definejs/string');
    const MD5 = require('@definejs/md5');

    const Lines = require('Lines');
    const Html = require('Html');
    const Meta = module.require('Meta');
    const Parser = module.require('Parser');
    const Watcher = module.require('Watcher');

    const mapper = new Map();

    class HtmlBlock {
        /**
        * 构造器。
        *   config = {
        *       patterns: [],   //路径模式列表。
        *       dir: '',        //路径模式中的相对目录，即要解析的页面所在的目录。 如 `htdocs/html/test/`。
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

        data = {}

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
        * 渲染生成 html 内容。
        * 主要提供给 watch 发生改变时快速混入。
        *   opt = {
        *       tabs: 0,    //缩进的空格数。
        *   };
        */
        render(opt) {
            let meta = mapper.get(this);

            meta.list.forEach((item, index) => {
                if (!item.link) {
                    console.error('item.link is null.');
                    console.error('item = ', item);
                    console.error('不存在 html 文件:' + item.file);
                    throw new Error();
                }

                let html = item.link.render({
                    'tabs': opt.tabs,
                });

                meta.contents[index] = html;
            });

            let html = Lines.join(meta.contents);

            return html;
        }

        /**
        * 编译。
        *   opt = {
        *       tabs: 0,        //要缩进的空格数。
        *       minify: false,  //是否压缩。
        *       dest: '',       //要写入的目标文件。 支持 `{md5}` 模板字段。
        *       transform: fn,  //可选。 渲染后，压缩前，要进行转换处理的回调函数。
        *   };
        */
        compile(opt) {
            opt = opt || {};

            let meta = mapper.get(this);
            let transform = opt.transform || function () { };

            //源文件列表。
            let list = meta.list.map((item) => {
                return item.file;
            });

            let content = meta.this.render({
                'tabs': opt.tabs,
            });

            let md5 = MD5.get(content);
            let dest = opt.dest;

            if (dest) {
                dest = $String.format(dest, {
                    'md5': md5,
                });
            }

            //让外界有机会进处转换处理。
            let content2 = transform(content, {
                'tabs': opt.tabs,
                'md5': md5,
                'dir': meta.dir,                 //相对目录。
                'dest': dest,
                'list': list,
            });

            if (typeof content2 == 'string') {
                content = content2;
            }


            let minify = opt.minify;

            if (minify) {
                content = Html.minify(content, minify);
            }

            if (dest) {
                File.write(dest, content);
            }


            return {
                content,
                md5,
                dest,
                minify,
                list,
            };
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

        toJSON(item) {
            let meta = mapper.get(this);
            let list = Parser.toJSON(meta.list);
            let html = item ? this.render(item) : undefined;
            
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


    return HtmlBlock;


});




