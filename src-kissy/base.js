/**
* CuteLink v@VERSION
*
* Date: @DATE
*
* Copyright given up 2011, Jianchao Yang.
*
* You can do whatever you want with this.
*
*/
(function(S) {
  //Extend KISSY
  S.mix(S, {
    /**
    * @param {array} funs 需要执行的函数，一个文本数组.
    * @param {object} context 函数上下文.
    */
    _invoke: function(funs, context) {
      if (funs)
        for (var i = 0; i < funs.length; i++)
        try {
          (new Function(funs[i])).apply(context);
          _log(funs[i] + '已触发');
        } catch (a) {}
    },
    /**
    * 只有在开发模式下，才输出调试信息
    */
    _log: function() {
      if (window._DEV_) S.log.apply(S, arguments);
    }
  });
})(KISSY);

KISSY.add('cutelink', function(S) {
  var _DATA = 'data',
  _PARAMS = 'params';

  //CuteLink应用构造器
  function CuteLink() {
    var self = this;

    S.mix(self, {
      _inited: false,
      camps: {}, //通过register方法注册的实例
      callbacks: {} //全局回调函数，方便各个实例调用
    });

    return self;
  }

  //全局性的参数缓存
  S.mix(CuteLink, {
    camps: [], //按照初始化顺序挤入的CuteCamp
    data: {}, //基于url的数据缓存
    params: {} //基于路径的url参数缓存
  });

  S.augment(CuteLink, S.EventTarget, {
    //清空缓存
    clear: function(cachekeys) {
      if (S.isArray(cachekeys)) {
        S.each(cachekeys, function(key) {
          delete CuteLink[_DATA][key];
        });
      } else {
        CuteLink[_DATA] = {};
      }
    },

    //要开始使用cutelink 必须先执行init操作
    init: function(conf) {
      var self = this;

      //支持改变配置项后再度初始化
      if (self._inited && !conf) return self;

      var conf = S.mix({
        //是否需要根据URL hash跳转
        doRedirect: true
      }, conf);

      //记录下当前的路径、参数和hashtag
      var initialUrl = window.location.href,
      crtLocParam = initialParam = CuteLink.getLocParam(),
      crtLocPath = CuteLink.getUrlPath(initialUrl);

      //存储当前地址的真实参数
      //不能存在 self 里
      CuteLink[_PARAMS][crtLocPath] = crtLocParam;

      var oninit = conf.oninit;
      //如果要跳转带hash的url 并且未指定初始化执行的事件
      if (conf.doRedirect && !oninit) {
        CuteLink.history.locCheck();
      } else if (S.isFunction(oninit)) {
        oninit.call(self, self.getUrlDetail(initialUrl));
      }

      self.fire('init', conf);
      self._inited = true;

      return self;
    }
  });

  S.CuteLink = CuteLink;

  return CuteLink;
});
