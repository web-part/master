/**
* 文件监控器类。
* @class
* @name Watcher
*/
define('Watcher', function (require, module, exports) {
    const Emitter = require('@definejs/emitter');
    const Patterns = require('@definejs/patterns');

    const Defaults = require('Defaults');
    const Path = require('Path');
    const Meta = module.require('Meta');
    const Events = module.require('Events');
    const defaults = require(`${module.id}.defaults`);

    const mapper = new Map();

    class Watcher {
        /**
        * 构造器。
        * 已重载 Watcher(config);
        * 已重载 Watcher(patterns);
        * 已重载 Watcher(pattern);
        *   config = {
        *       patterns: [],   //要监控的文件路径模式列表。
        *   };
        */
        constructor(config) {
            if (Array.isArray(config)) {
                config = { 'patterns': config, };   //重载 Watcher(patterns);
            }
            else if (typeof config == 'string') {
                config = { 'patterns': [config], }; //重载 Watcher(pattern);
            }

            config = Defaults.get(module, config);


            let meta = Meta.create(config, {
                'this': this,
                'emitter': new Emitter(this),
            });

            mapper.set(this, meta);

            Object.assign(this, {
                'id': meta.id,
                'meta': meta,
            });

            Events.bind(meta);

        }

        /**
        * 绑定事件。
        * 已重载 on({...}); 批量绑定。
        * 已重载 on(name, fn); 单个绑定。
        */
        on(...args) {
            let meta = mapper.get(this);
            meta.emitter.on(...args);
        }

        /**
        * 设置新的监控文件列表。
        * 该方法会重新设置新的要监控的文件列表，之前的列表则不再监控。
        */
        set(dir, patterns) {
            let meta = mapper.get(this);
            let watcher = meta.watcher;
            let files = this.get();

            //先清空之前的
            files.forEach((file) => {
                watcher.remove(file);
            });

            patterns = meta.patterns = Patterns.join(dir, patterns);
            watcher.add(patterns);
        }

        /**
        * 获取当前监控的文件和目录列表。
        */
        get() {
            let meta = mapper.get(this);
            let dir$files = meta.watcher.relative();
            let list = [];

            //先清空之前的
            $Object.each(dir$files, (dir, files) => {
                files.forEach((file) => {
                    file = Path.join(dir, file);
                    list.push(file);
                });
            });

            return list;
        }

        /**
        * 添加新的监控文件列表。
        * 该方法会在原来的列表基础上添加新的要监控的文件列表。
        */
        add(dir, patterns) {
            let meta = mapper.get(this);
            let watcher = meta.watcher;

            patterns = Patterns.join(dir, patterns);

            //合并，去重。
            meta.patterns = [...new Set([
                ...patterns,
                ...meta.patterns,
            ])];

            watcher.add(patterns);
        }

        /**
        * 从监控中列表中删除指定的文件。
        * 已重载 delete(file);         //删除一个文件。
        * 已重载 delete(patterns);     //删除指定模式的文件列表。
        */
        delete(patterns) {
            let meta = mapper.get(this);
            let files = Patterns.getFiles(patterns);

            //先清空之前的
            files.forEach(function (file) {
                meta.watcher.remove(file);
            });
        }

        /**
        * Unwatch all files and reset the watch instance.
        */
        close() {
            let meta = mapper.get(this);
            meta.watcher.close();
        }

        /**
        * 销毁本实例。
        */
        destroy() {
            let meta = mapper.get(this);

            meta.watcher.close();
            meta.emitter.destroy();
            meta.emitter = null;        //在 Events 子模块中用到。

            mapper.delete(this);
        }

        /**
        * 
        */
        static log() {
            let name = defaults.name;

            if (name) {
                console.log('>>'.cyan, `${name}`.bgGreen, `watching...`);
            }
            else {
                console.log('>>'.cyan, `watching...`);
            }

        }
    }


    return Watcher;


});




