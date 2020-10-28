
/**
* 
*/
define('Package/Watcher', function (require, module, exports) {
    const $Object = require('@definejs/object');
    
    const Watcher = require('Watcher');


    return {
        /**
        * 
        *   options = {
        *       compare: fn,
        *       LessBlock: Module,
        *       HtmlBlock: Module,
        *       JsBlock: Module,
        *    };
        */
        create(meta, options) {
            let watcher = new Watcher(meta.file);

            //包的内容发生了变化。
            watcher.on('modify', function () {
                let info = options.compare();

                if (!info) {
                    console.log('包的实质内容没有发生变化。'.yellow);
                    Watcher.log();
                    return;
                }

                meta.this.reset();
                meta.this.parse(info);

                let old = meta.old;


                //新建的。
                if (meta.LessBlock !== old.LessBlock) {
                    old.LessBlock && old.LessBlock.destroy();
                    options.LessBlock.watch(meta);
                }

                if (meta.HtmlBlock !== old.HtmlBlock) {
                    old.HtmlBlock && old.HtmlBlock.destroy();
                    options.HtmlBlock.watch(meta);
                }

                if (meta.JsBlock !== old.JsBlock) {
                    old.JsBlock && old.JsBlock.destroy();
                    options.JsBlock.watch(meta);
                }

                old.LessBlock = null;
                old.HtmlBlock = null;
                old.JsBlock = null;



                //包的名称发生了变化。
                if (meta.name != old.name) {
                    $Object.each(old.type$output, (type, output) => {
                        meta.expire(type);
                    });

                    meta.emitter.fire('change', 'name', [old.name, meta.name]);
                }


                meta.emitter.fire('change', 'content', [info]);

            });



            return watcher;

        },


    };

});


