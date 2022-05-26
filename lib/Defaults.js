
define('Defaults', function (require, module, exports) {
    const $Object = require('@definejs/object');

    return exports = {
        /**
        * 用深合并的方式设置指定内部模块的默认配置。
        * 已重载 set(moduleId, key, value); //设置单个属性。
        * 已重载 set(moduleId, key$value); //设置多个属性。
        * @param {string} moduleId 要设置的模块 id。 如 `Watcher`。
        * @param {Object} data 要设置的数据对象。
        */
        set(moduleId, key, value) { 
            //如 `Watcher.defaults`。
            let defaults = require(`${moduleId}.defaults`);

            if (!defaults) {
                throw new Error(`无法设置模块 ${moduleId} 的默认配置，因为不存在 ${moduleId}.defaults 模块。`);
            }

            let data = typeof key == 'object' ? key : { [key]: value, };

            //深合并。
            return $Object.deepAssign(defaults, data);
        },

        /**
        * 获取指定模块的默认配置。
        * 如果指定了第二个参数，则会使用深度合并的方式返回一个新的配置对象。
        * @param {string}} name 必选，要获取的模块 id。 如 `Watcher`。
        * @param {Object} config 可选，需要同时合并的附加对象。 
        *   如果指定此参数，则使用深度合并的方式返回一个新的配置对象。
        */
        get(name, config) {
            let id = typeof name == 'object' ? name.id : name;
            let defaults = require(`${id}.defaults`);

            if (!config) {
                return defaults;
            }

            let args = [...arguments].slice(1);

            defaults = $Object.deepAssign({}, defaults, ...args);

            return defaults;

        },

        /**
        * 设置默认配置 defaults 中的各个字段到对应模块的配置中。
        * 配置中的哪个字段对应到哪个模块，由传入的映射规则指定。
        * 如果某个字段没有指定映射规则，则查找是否存在同名的 `{字段名}.defaults` 模块，找到则设置。
        * @param {*} defaults 总的默认配置对象。
        * @param {*} key$rule 要指定 defaults 中要映射到某个模块的规则。
        */
        config(defaults, key$rule) { 
            $Object.each(defaults, (key, value) => {
                //确保被配置的值为一个对象。
                //如 `htdocs: 'htdocs/',` --> { htdocs: 'htdocs/', };
                //再去调用 exports.set('WebSite', { htdocs: 'htdocs/', });
                let data = $Object.isPlain(value) ? value : { [key]: value, }; 
                let rule = key$rule[key];
                
                let ruleType =
                    Array.isArray(rule) ? 'Array' : 
                    $Object.isPlain(rule) ? 'Object' : typeof rule;

                switch (ruleType) {
                    case 'string':
                        //如 exports.set('WebSite', { htdocs: 'htdocs/', });
                        exports.set(rule, data);   
                        return;
                    
                    case 'function':
                        rule(value);
                        return;
                    
                    case 'Array':   //如 rule = [ `Watcher`, `MasterPage`, ];
                        rule.forEach((item) => {
                            exports.set(item, data);
                        });
                        return;
                    
                    case 'Object':  //如 rule = { 'sample': 'Css', };
                        exports.config(data, rule); //进一步递归。
                        return;
                }

                //其它情况。
                //没有指定映射规则，则查找一下该字段是否存在同名模块的默认配置。
                //如 defaults 对象中指定了 `WebSite: {}`，则查找一下是否存在 `WebSite.defaults` 模块，
                //如果存在，则直接设置。
                if (define.has(`${key}.defaults`)) {
                    exports.set(key, data);
                }




            });
        },
       
    };
});