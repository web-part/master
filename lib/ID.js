

define('ID', function (require, module, exports) {
   
    const name$index = {};


    return {
        /**
        * 获取指定分组中的下一个 id。
        * @param {string} name 分组名称。 如 `HtmlLink`。
        * @returns {string} 返回生成的 id，结构为分组名开头的，以递增序号为结尾。
        * @example
        *   ID.next('HtmlLink'); //可能返回的结果为 `HtmlLink-1`。
        */
        next(name) {
            if (!name || typeof name != 'string') {
                throw new Error(`参数 name 必须非空，且必须为 string 类型。`);
            }
            
            let index = name$index[name] || 0;

            index = name$index[name] = index + 1;

            return `${name}-${index}`;
        },
    };
});