/**
* 静态引用 html 片段资源文件。
*/
define('HtmlLink', function (require, module, exports) {
    const console = require('@webpart/console');
    const Emitter = require('@definejs/emitter');
    const File = require('@definejs/file');
    const Lines = require('Lines');

    const Meta = module.require('Meta');
    const Parser = module.require('Parser');
    const Tabs = module.require('Tabs');
    const Watcher = module.require('Watcher');

    const defaults = require(`${module.id}.defaults`);
    const mapper = new Map();

    class HtmlLink {
        /**
        * 构造器。
        *   config = {
        *       file: '',       //必选，html 片段文件路径。
        *       content: '',    //可选，html 片段文件内容。 如果与 file 字段同时指定，则优先取 content 字段。
        *       parent: null,   //可选，所属于的父节点。
        *       regexp: RegExp, //可选，提取出引用了 html 片段文件的标签的正则表达式。
        *   };
        */
        constructor(config) {
            config = Object.assign({}, defaults, config);

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

        id = '';

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
        */
        parse() {
            let meta = mapper.get(this);

            let info = Parser.parse({
                'regexp': meta.regexp,
                'file': meta.file,
                'content': meta.content,
            });

            Object.assign(meta, info);

            //解析出来的新列表，尽量复用之前创建的实例。
            let file$link = meta.file$link;     //当前集合。
            let old$link = meta.old.file$link;  //旧集合。
            let news = [];  //需要新建的。
            let olds = [];  //可以复用的。

            meta.list.forEach((item) => {
                let file = item.file;
                let link = old$link[file];

                if (!link) {
                    news.push(item);
                    return;
                }

                item.isOld = true;
                olds.push(file);
                item.link = file$link[file] = link;
            });


            //有可能同一个文件名给引用了多次，这里也对应为一个实例。
            news.forEach((item) => {
                let file = item.file;

                if (!File.exists(file)) {
                    console.error('不存在 html 文件', file);
                    console.log('所在的 html 文件'.bgCyan, meta.file.cyan);
                    Lines.highlight(info.lines, item.no);
                    throw new Error();
                }

                let link = file$link[file] || new HtmlLink({
                    'file': file,
                    'parent': meta.this,
                });

                item.link = file$link[file] = link;
                link.parse();
            });

            //释放备份中没有复用到的实例。
            Object.keys(old$link).forEach((file) => {
                let link = old$link[file];
                delete old$link[file];

                if (!olds.includes(file)) {
                    link.destroy();
                }
            });

        }

        /**
        * 渲染生成 html。
        * 把对 html 分文件的引用用所对应的内容替换掉。
        *   opt = {
        *       tabs: 0,    //缩进的空格数。
        *   };
        */
        render(opt = {}) {
            let meta = mapper.get(this);

            //不符合当前设定的环境，则不生成 html 内容。
            //明确返回 null，可以删除该行内容，而不是生成一个空行。
            if (!meta.isEnvOK) {
                return null;
            }

            let tabs = opt.tabs || 0;
            let key = JSON.stringify(opt);
            let html = meta.key$output[key];

            //优先使用缓存。
            if (html) {
                //console.log('使用缓存'.bgGreen, meta.file.gray);
                return html;
            }


            let lines = meta.lines;

            meta.list.map((item, index) => {
                let tabs = item.tabs;

                let html = item.link.render({
                    'tabs': tabs,
                });

                //明确指定了要缩进的空格数，则添加特殊而唯一的开始和结束标记，
                //把 html 内容包起来，以便在别的模块作最终处理。
                //因为这里是无法得知本身应该缩进多少的，在最终要生成的 html 页面中才可以得知并进行处理。
                if (item.props.tabs) {
                    html = Tabs.wrap({
                        'content': html,
                        'origin': tabs,
                        'target': item.props.tabs,
                        'file': item.file,
                    });
                }

                lines[item.no] = html;
            });

            html = Lines.stringify(lines, ' ', tabs);
            meta.key$output[key] = html;

            console.log('混入'.yellow, meta.file.green);

            return html;

        }

        /**
        * 监控当前引用文件和下级列表的变化。
        */
        watch() {
            let meta = mapper.get(this);

            if (!meta.isEnvOK) {
                return;
            }

           
            meta.watcher = meta.watcher || Watcher.create(meta);

            meta.list.map((item, index) => {
                //有些是复用过来的，则可能已给 watch 过了。
                if (item.isOld) {
                    return;
                }

                let link = item.link;

                //多个下级在一定时间内的多次 change 只会触发当前实例的一次 change 事件。
                link.on('change', function () {
                    let html = link.render({
                        'tabs': item.tabs,
                    });

                    meta.lines[item.no] = html;
                    meta.key$output = {};      //下级发生了变化，本级缓存作废。
                    meta.change(meta.changeDelay);
                });

                link.watch();
            });

        }

        /**
        * 迭代执行每个下级。
        */
        each(fn) {
            let meta = mapper.get(this);
            meta.list.forEach(fn);
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
            let html = item ? this.render(item) : undefined; //如果传 item 则 render()。

            let json = {
                'type': module.id,
                'id': meta.id,
                'parent': meta.parent ? meta.parent.id : '',
                'file': meta.file,
                'dir': meta.dir,
                'content': meta.content,
                'render': html,
                'list': list,
            };

            return json;
        }


        //静态方法。
        static parse({ file, content, regexp, }) {
            return Parser.parse({
                'file': file,
                'content': content,
                'regexp': regexp || defaults.regexp,
            });
        }

        static replaceTabs = Tabs.replace;
        static toJSON = Parser.toJSON;
    }

    return HtmlLink;


});




