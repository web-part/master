
/**
* 
*/
define('MasterPage/HtmlBlocks', function (require, module, exports) {
    const console = require('@webpart/console');
    const Path = require('Path');
    const Lines = require('Lines');
    const BlockList = require('BlockList');
    const HtmlBlock = require('HtmlBlock');


    return exports = {
        /**
        * 
        */
        parse(meta) {
            //解析出来的新列表，尽量复用之前创建的实例。
            let file$block = meta.patterns$HtmlBlock;     //当前集合。
            let old$block = meta.old.patterns$HtmlBlock;  //旧集合。
            let news = [];  //需要新建的。
            let olds = [];  //可以复用的。

            let list = BlockList.parse(meta.lines, meta.tags.html);

            //console.log(list);

            list.forEach((item) => {
                let file = item.patterns.join();    //把整个路径模式看作一个整体。
                let block = old$block[file];

                if (!block) {
                    news.push(item);
                    return;
                }

                item.isOld = true;
                olds.push(file);
                item.block = file$block[file] = block;

                //同一个路径模式对应的实例只能给复用一次。
                //如果后续再遇到相同的路径模式，则只能新建一个，
                //不过，这种情况在现实中几乎不可能出现，
                //因为同一个页面中出现多个完全相同的路径模式没任何意义。
                delete old$block[file];
            });


            //有可能同一个文件名给引用了多次，这里也对应为一个实例。
            news.forEach((item) => {
                let file = item.patterns.join();
                let block = item.block = file$block[file];

                if (block) {
                    return;
                }

                block = new HtmlBlock({
                    'dir': meta.dir,
                    'patterns': item.patterns,
                    'excludes': meta.excludes['html'],
                    'delay': 0,
                });

                block.parse({
                    error(file) {
                        console.error('不存在 html 文件', file);
                        console.log('所在的 html 文件'.bgCyan, meta.file.cyan);

                        file = Path.relative(meta.dir, file);
                        BlockList.highlight(meta.lines, item, file);

                        throw new Error();
                    },
                });

                item.block = file$block[file] = block;
            });

            //释放备份中没有复用到的实例。
            Object.keys(old$block).forEach((file) => {
                let block = old$block[file];
                delete old$block[file];

                if (!olds.includes(file)) {
                    block.destroy();
                }
            });

            return list;
        },



        /**
        * 
        */
        render(meta, done) {

            meta.HtmlBlocks.forEach((item) => {

                let html = item.block.render({
                    'tabs': item.tabs,
                });

                Lines.replace(meta.lines, item.begin, item.end, html);
            });

            done();
        },

        /**
        *
        */
        watch(meta) {
            meta.HtmlBlocks.forEach((item) => {
                if (item.isOld) { //复用过来的，不需要重新绑定。
                    return;
                }

                item.block.on('change', function () {
                    let html = this.render({
                        'tabs': item.tabs,
                    });

                    Lines.replace(meta.lines, item.begin, item.end, html);
                    meta.mix(true);
                });

                item.block.watch();

            });

        },

        toJSON(meta) {
            let list = meta.HtmlBlocks.map(function (item) {
                let block = item.block.toJSON(item);

                //以下字段参照 `BlockList/Item` 模块。
                return {
                    'begin': item.begin,
                    'end': item.end,
                    'tabs': item.tabs,
                    'tags': item.tags,
                    'content': item.content,
                    'patterns': item.patterns,
                    'block': block,
                };
            });

            return list;
        },
    };

});


