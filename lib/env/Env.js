
/**
* 管理与自定义环境相关的文件。
* 此模块为单实例，是为了方便给其它模块使用上更简单，但从设计模式上并不是一种好的模式。
*/
define('Env', function (require, module, exports) { 
    const Env = require('@webpart/env');

    let defaults = require(`${module.id}.defaults`);
    let env = null;

    function init() { 
        if (!env) {
            env = new Env(defaults);
        }

        return env;
    }

    return {

        set(name) { 
            let env = init();
            env.set(name);
        },
        
        check(file, external) { 
            //是外部资源，必须无条件为 true，以表示匹配当前环境。
            if (external) {
                return true;
            }

            let env = init();
            return env.check(file);
        },

        filter(files) { 
            let env = init();
            return env.filter(files);
        },

    };
});