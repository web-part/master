
/**
* 
*/
define('CssLink/MD5', function (require, module, exports) {
    const MD5 = require('@definejs/md5');


    return {

        get(meta, len) {
            if (meta.external) {
                return;
            }


            len = len || 0;
            len = len === true ? 32 : len;


            //内部文件才能生成 md5。
            let value = MD5.read(meta.file);
            let key = value.slice(0, len);

            return { value, len, key, };

         
          

           
        },

    };
    
});


