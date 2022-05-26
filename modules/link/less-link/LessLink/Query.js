
/**
* 
*/
define('LessLink/Query', function (require, module, exports) {

    return {

        get(meta, query, md5) {
            if (typeof query == 'function') {
                query = query(meta.output);
            }

            query = query || {};

            if (md5 && md5.len) {
                query[md5.key] = undefined;//这里要用 undefined 以消除 `=`。
            }

            return query;

           
        },

    };
    
});


