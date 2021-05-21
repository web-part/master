
/**
* 获取块中的路径模式列表。
*/
define('BlockList/Patterns', function (require, module, exports) {
    const console = require('@webpart/console');
    const Lines = require('Lines');


    return {
        /**
        * 提取里面的模式。
        */
        get(lines) {
            let patterns = lines.slice(2, -2);

            if (!patterns.length) {
                return [];
            }

            patterns = Lines.join(patterns);


            //执行母版页的 js 代码，并注入变量。
            try {
            
                //包装多一层匿名立即执行函数
                let code = `
                    return (function () { 
                        let a = ${patterns};
                        return a;
                    })();
                    `;

                let fn = new Function('require', code);

                //执行动态函数后，fn 为：
                /*
                let fn = function (require) {
                    return (function () {
                        let a = []; //${patterns}
                        return a;
                    })();
                };
                */

                patterns = fn(require);
            }
            catch (ex) {
                console.log(ex);
                patterns = [];
            }
     

            if (!Array.isArray(patterns)) {
                console.log('返回模式必须是一个数组。'.red);
                console.log(lines);
                patterns = [];
            }

            return patterns;
        },
    };

});




