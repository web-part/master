
/**
* 静态引用 css 资源文件。
*/
define('CssLink', function (require, module, exports) {
    const Emitter = require('@definejs/emitter');
    const MD5 = require('@definejs/md5');
    
    const Css = require('Css');

    const Meta = module.require('Meta');
    const Parser = module.require('Parser');
    const Watcher = module.require('Watcher');
    const Builder = module.require('Builder');

    const defaults = require(`${module.id}.defaults`);
    const mapper = new Map();

    class CssLink {
        /**
        * 构造器。
        *   config = {
        *       file: '',   //输入的源 css 文件路径。
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
                'data': {},     //用户的自定义数据容器。
            });

        }

        data = {};


        /**
        * 渲染生成 html 内容。
        *   内联: `<style>...</style>`。
        *   普通: `<link href="xx.css" rel="stylesheet" />`。
        *   options = {
        *       inline: false,      //是否内联。
        *       tabs: 0,            //缩进的空格数。
        *       href: '',           //生成到 link 标签中的 href 属性值。
        *       md5: 4,             //添加到 href 中 query 部分的 md5 的长度。
        *       query: {} || fn,    //添加到 href 中 query 部分。
        *       props: {},          //生成到标签中的其它属性。
        *    };
        */
        render(options) {
            let meta = mapper.get(this);
            let props = Object.assign({}, options.props);

            delete props['data-meta'];  //删除元数据属性。

            //只有明确指定了内联，且为内部文件时，才能内联。
            if (options.inline && !meta.external) {
                let html = Css.inline({
                    'file': meta.file,
                    'comment': true,
                    'props': props,
                    'tabs': options.tabs,
                });

                return html;
            }

            //普通方式。
            let md5 = options.md5 || 0;
            let href = options.href;
            let query = options.query || {};

            if (typeof query == 'function') {
                query = query(meta.output);
            }

            if (!meta.external) {
                md5 = md5 === true ? 32 : md5;  //md5 的长度。

                if (md5 > 0) {
                    md5 = MD5.read(meta.file, md5); //md5 串值。
                    query[md5] = undefined; //这里要用 undefined 以消除 `=`。
                }
            }


            let html = Css.mix({
                'href': href,
                'tabs': options.tabs,
                'props': props,
                'query': query,
            });

            return html;
        }


        /**
        * 监控。
        */
        watch() {
            let meta = mapper.get(this);

            if (meta.watcher) {
                return;
            }

            meta.watcher = Watcher.create(meta);


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

            meta.emitter.destroy();
            meta.watcher && meta.watcher.destroy();
            mapper.delete(this);
        }


        static parse(content, { dir, }) {
            return Parser.parse(content, {
                'dir': dir,
                'regexp': defaults.regexp,
            })
        }

        static build = Builder.build;
    }





    return CssLink;



});




