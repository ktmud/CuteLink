KISSY.add('cutelink/register', function(S, undefined) {
  var win = window,
  doc = document,
  $ = S.all,
  D = S.DOM,
  _invoke = S._invoke,
  _log = S._log,

  CuteLink = S.CuteLink,

  PAT_SEARCH = /\?(\w[^#]+)/,
  PAT_URL = /([^#\?]*)(\?([^#\?]*))?(#!?([^#]*$))?/,
  PAT_HASH = /#[^#]*$/,
  SLASH = '/', BLANK = '',
  QUESTION_MARK = '?', COMMA = ',',
  ATTR_GUID = '_cl-guid',
  _STATUS = 'status',
  _CACHE = 'cache', _QUEUE = 'queue',
  _INIT = 'init', _PARSE = 'parse', _START = 'start',
  _LOAD = 'load', _LOADED = 'loaded',
  _RENDER = 'render', _RENDERED = 'rendered',
  _ERROR = 'error', _LOADING = 'loading';

  //--------- helper functions-------------//{{{
  //中文编码处理
  function encodeURL(s) {
    var link = document.createElement('a');
    function escapeDBC(s) {
      if (!s) return BLANK;
      if (window.ActiveXObject) return s.replace(/[\d\D]/g, function($0) {
        window.vbsval = '';
        execScript('window.vbsval=Hex(Asc("' + $0 + '"))', 'vbscript');
        return '%' + window.vbsval.slice(0, 2) + '%' + window.vbsval.slice(-2);
      });
      link.href = '?key=' + s;
      return link.href.split('key=').pop();
    }
    return s.replace(/([^\x00-\xff]+)|([\x00-\xff]+)/g, function($0, $1, $2) {
      return escapeDBC($1) + encodeURIComponent($2 || '');
    });
  }

  //根据URL判断添加 ? 或 &
  function _url_plus(url) {
    return (_str_has(url, QUESTION_MARK) ? '&' : QUESTION_MARK);
  }

  function _str_has(str, search) {
    if (!S.isString(str)) return false;
    return str.indexOf(search) != -1;
  }

  //检查某个node的tagName是否为指定tag之一
  function checkTagName(node, name) {
    var nodetag = node[0].tagName.toLowerCase(),
    tochecks = name.split('|'),
    ret = false;
    for (var i = tochecks.length - 1; i >= 0; i--) {
      if (nodetag == tochecks[i]) {
        ret = true;
        break;
      }
    }
    return ret;
  }

  //动了个画?
  //time begin change duration
  function easing(t, b, c, d) {
    //easeOutQuint
    return c * (Math.pow(t / d - 1, 5) + 1) + b;
    //easeOutQuart
    //return -c * (t/=d)*(t-2) + b;
  }

  function _scrollTo(target, offset) {
    var offset = offset || 0,
    target = $(target);

    if (!target.length) return;

    var startTop = D.scrollTop(),
    startLeft = D.scrollLeft(),
    destTop = target.offset().top + offset,
    gap = destTop - startTop,
    step = 20,
    duration = 400;

    if (Math.abs(startTop - destTop) < 5) return;

    function runFrame(t) {
      if (t >= duration) return;

      t += step;

      var point = easing(t, startTop, gap, duration);

      setTimeout(function() {
        win.scrollTo(startLeft, point);
      }, t);

      runFrame(t);
    }
    runFrame(0);
  }

  function execCallback(fun, data) {
    if (S.isFunction(fun)) {
      fun.call(this, data);
    } else if (S.isArray(fun)) {
      _invoke(fun, this);
    } else if (S.isObject(fun) && S.isObject(data)) {
      //按key执行函数 并传入context中指定的数据
      for (var i in data) {
        try {
          //根据context中的data指定的键值调用
          fun[i].call(this, data[i]);
        } catch (e) {
          _log(e);
          _log('执行 ' + i + ' 回调出错', 'warn');
          _log(data);
        }
      }
    }
  }
  //}}}

  var defConf = {
    //baseCamp: undefined, //需要绑定事件的内容区块
    //nativeSubmit: undefined, //当内容区块是表单时，是否只需默认提交即可
    dataType: 'json', //所请求数据的类型
    intf: '_self', //如何获取接口地址
    intfAttr: 'data-cl-intf', //获取接口地址的自定义属性
    intfParam: BLANK, //每个异步请求都要加上的参数
    loadingCls: 'loading', //给目标容器加上何种class
    oneLoading: false, //发新请求前是否必须等待上一个请求完成
    //如何提示用户说，正在载入
    loadingTip: function() {
      alert('上一次请求尚未完成，请稍后...');
    },
    //pushState: !(S.UA.ie < 7), //是否需要把请求状态存储到地址栏
    pushState: true, //是否需要把请求状态存储到地址栏
    doCache: true, //是否缓存链接返回的内容
    doRefresh: true, //当连续点击同一个链接时，是否刷新缓存
    cacheLife: 5, //缓存的寿命，单位为分钟
    //onload: [],  //渲染完成时的回调
    onerror: '_fallback', //异步请求出错时的回调
    execGlobal: true,  //是否执行全局回调
    scrollTo: '_target', //载入完成后页面滚动到何区域
    scrollOffset: 0, //滚动到的位置的偏移
    scrollTiming: _RENDERED //滚动的时机
  };

  /**
  * 按区块初始化CuteLink实例 {{{
  *
  * Config 配置项：
  *
  * @param {kissy selector} baseCamp 所点击的链接所在的区块.
  *               如果这个区块是一个表单，则默认也会绑定表单的提交事件。
  *               提交事件的ajax接口，根据form的自定义属性或config.intf判断.
  *
  * @param {kissy selector} target 获取后的内容要更新到的内容区域.
  *
  * @param {string} loadingCls loading的时候为target切换的class.
  *
  * @param {string} dataType 数据接受后的处理方式, 默认直接更新HTML
  *                          其他可能的值:
  *                          * script -- 将返回结果作为一段script插入.
  *                          * json   -- 返回结果时一个json对象，
  *                                      可通过自定义事件的e.data获取.
  *
  * @param {string|function} intf (interface) 数据接口的获取方式.
  *            可能的值:
  *            * (function) -- 一个函数，通过调用该函数做出判断.
  *            * _default  -- 链接的自定义属性优先，否则取链接的URL本身.
  *            * _self -- 链接地址本身.
  *            * _indie -- 自定义属性指定的地址.
  *            * (其他) -- 查询字串会直接附在此地址后.
  *
  * @param {string} intfAttr 如果接口类型为独立，获取接口的HTML属性名.
  * @param {string} intfParam 发送异步请求时需要带上的参数,
  *                           不会push到地址栏.
  * @param {string} scollTo 内容更新后是否滚动到某个区域,
  *                         默认滚动到目标内容区域.
  * @param {number} scollOffset 滚动的偏移.
  * @param {number} scollTiming 滚动的时机，支持的自定义事件名.
  * @param {array|function|object} onload 渲染完成时的回调.
  * @param {string|array|function|object} onerror 请求出错时的回调.
  * @param {boolean} execGlobal  是否执行全局回调, 如果数据类型是json,
  *                              则根据json对象的键值执行,
  *                              如果数据类型是html，
  *                              则根据注册实例时指定的id执行.
  *
  * 提示：onerror 和 onload 的回调事件的 this , 都是自定义事件对象.
  *
  * 自定义事件列表：
  *
  *   # start   --  点击链接，参数处理完毕，要开始渲染或发请求时
  *   # load    --  发起异步请求时
  *   # loaded  --  异步请求完成
  *   # error   --  请求出错时
  *   # render  --  开始渲染
  *   # renderd --  渲染完成
  *
  *   (!)注意: 如果启用了缓存，则有些点击可能只会执行render，
  *            而不会有load.
  *
  */
  //}}}
  function CuteCamp(conf) {
    var self = this;
    self.init(conf);
    //返回所注册模块的一些配置信息
    return self;
  }


  var dataCache = CuteLink.data;

  S.augment(CuteCamp, S.EventTarget, {
    //根据队列和 guid+url 检查某请求是否已经被抢占
    //如果队列后面还有其他
    checkQueue: function(queueId) {//{{{
      var q = this[_QUEUE],
      crtIndex = q.indexOf(queueId),
      l = q.length;

      if (crtIndex == -1) {
        //找不到当前项
        return;
      } else {
        //当前项已经载入完成，做个标识
        q[crtIndex] = _LOADED + '||' + q[crtIndex];
      }

      //如果是最后一位
      if (crtIndex == l - 1) return;

      //向后查找，如果有坑，说明已经有后发的请求被载入完成，
      //删掉这个坑，并且报return = false
      for (var i = crtIndex + 1; i < l; i++) {
        if (q[i].indexOf(_LOADED) == 0) {
          _log('[CuteLink]第 ' + (crtIndex + 1) + ' 个请求已经被第 ' + (i + 1) + ' 个抢占', 'warn');
          return true;
        }
      }
    },
    //}}}

    //初始化 绑定事件
    init: function(conf) { //{{{
      var self = this,
      conf = S.merge(defConf, conf),
      dataType = conf.dataType,
      intfAttr = conf.intfAttr,
      intfParam = conf.intfParam,
      loadingCls = conf.loadingCls,
      defScrollTo = conf.scrollTo,
      scrollOffset = conf.scrollOffset,
      container = $(conf.baseCamp),
      targetContainer = $(conf.target);

      if (!container.length) return self;

      if (conf.scrollTo == '_target') {
        defScrollTo = conf.scrollTo = targetContainer;
      }

      conf = self.config = conf;
      self.isLoading = false;

      //通过事件代理处理链接点击
      container.on('click', userEventHandle);

      //处理表单的提交事件绑定 对于post请求的表单 不处理
      var theform = checkTagName(container, 'form') ? container : $('form', container[0]);
      if (theform.length && !conf.nativeSubmit && theform[0].method.toLowerCase() != 'post') {
        theform.on('submit', userEventHandle);
      }

      self.id = conf.id || S.guid();
      self.base = container;
      self.target = targetContainer;

      //队列管理
      //ajax请求发起前插入队列，请求结束后从队列中删除
      self[_QUEUE] = [];

      //根据scrollTiming 绑定滚动页面事件
      self.on(conf.scrollTiming, function(e) {
        e.scrollTo ? _scrollTo(e.scrollTo, scrollOffset) : BLANK;
      });

      //ajax请求出错时执行
      self.on(_ERROR, function(e) {
        var onerror = conf.onerror;
        //指定为fallback，则调到链接本身的地址
        if (onerror === '_fallback') {
          window.location = e.url;
        } else {
          execCallback.call(self, onerror, e);
        }
      });

      self.on(_RENDER, function(e) {
        if (dataType == 'html') {
          targetContainer.html(e.data);
        }

        //触发渲染完成的事件绑定
        self.fire(_RENDERED, e);
      });

      self.on(_RENDERED, function(e) {
        //是否执行全局回调
        if (conf.execGlobal) {
          var global_callbacks = self.builder.callbacks,
          selfId = self.id;

          if (dataType == 'html' && selfId) {
            var gbc = global_callbacks[selfId];
            gbc && gbc.call(e);
          } else {
            execCallback.call(self, global_callbacks, e.data, e);
          }
        }

      });

      //处理用户点击、或者表单提交事件
      function userEventHandle(e) { //{{{
        var elem = this,
        target = e.target,
        isFormSubmit = false;

        if (checkTagName(target, 'form') && e.type == 'submit') {
          isFormSubmit = true;
        } else {
          if (!checkTagName(target, 'a')) target = target.parent('a');
          if (!target) return;
        }

        // = step.1 = 执行初始化操作之前的判定
        var parse_ret = self.fire(_PARSE, {
          target: target,
          originEvent: e
        });

        //事件的返回值不是其本身，说明有问题 取消后续操作
        if (parse_ret && parse_ret != self) return;

        // = step.2 = 分析链接，获取接口地址
        var intfRet = self.parseTarget(target, e, isFormSubmit);

        //返回值不符合格式，停止后续操作
        if (!S.isObject(intfRet)) return;

        // = step.3 = 开始发请求之前的初始化处理

        //绑定全局ID，加入队列
        var guid = target[0].id || target.attr(ATTR_GUID);
        if (!guid) target.attr(ATTR_GUID, guid = S.guid());


        //根据当前url缓存  获取真实url (此时也更新了全局url缓存)
        var intfUrlInfo = urlInfo = CuteLink.makeRealQuery(intfRet.url),
        intfUrl = url = urlInfo.url;

        if (intfRet.intfUrl != intfRet.url) {
          intfUrlInfo = CuteLink.makeRealQuery(intfRet.intfUrl);
          intfUrl = intfUrlInfo.url;
        }

        //添加接口后缀
        if (intfParam) intfUrl += _url_plus(intfUrl) + intfParam;
        //用guid 而不是时间戳
        intfUrl += _url_plus(intfUrl) + '_cl_t=' + guid;

        var crt_req_info = guid + '::' + url;

        if (crt_req_info == self.current && conf.doRefresh) delete dataCache[url];
        self.current = crt_req_info;

        // = step.4 = 判断加载状态
        var evtData = {
          isFormSubmit: isFormSubmit,
          guid: guid,
          target: target,
          urlInfo: urlInfo,
          intfUrlInfo: intfUrlInfo,
          url: url,
          intfUrl: intfUrl,
          data: dataCache[url],
          scrollTo: intfRet.scrollTo || defScrollTo
        };

        //如果必须等待上一次载入完成，就什么都不做嘛
        if (self.isLoading && conf.oneLoading) {
          try {
            conf.loadingTip.call(self, evtData);
          } catch (e) {}
          return e.halt();
        }

        // = step.6 = 开始发请求或渲染
        //允许pushState; 则改变地址栏，让改变地址的事件去发请求
        if (conf.pushState) {
          CuteLink.history.navigate(url, self, evtData);
        } else {
          self.doRequest(evtData);
        }

        //停止默认事件
        e.preventDefault();
      }
      //}}}

    },
    //}}}

    //根据pushUrl和相关配置，获取参数接口地址
    getIntfUrl: function(url, target) {//{{{
      //链接本身的地址
      var self = this,
      conf = self.config,
      //链接的自定义属性指定的接口地址（可能为空）
      intfAttr = conf.intfAttr,
      attrVal = target && target.attr(intfAttr),
      ret;

      var intf = conf.intf;

      //全局定义或为自定义函数的，从CuteLink的全局参数获取
      if (intf == '_global' || S.isFunction(intf)) intf = self.builder.intf;


      switch (intf) {
      case '_default':
        //2. 默认模式
        //数据接口优选自定义属性所指定
        //否则和链接URL保持一致
        intfUrl = attrVal || url;
        break;

      case '_self':
        //3. 共享模式
        //和链接href保持一致
        intfUrl = url;
        break;

      case '_indie':
        //4. 独立模式
        //数据接口由自定义属性所指定
        intfUrl = attrVal;
        break;

      default:
        //4. 直接指定接口的路径
        //将链接的search参数直接传给接口地址
        intfUrl = intf + _url_plus(intf) + CuteLink.getUrlSearch(url);
      }

      return intfUrl;
    },//}}}

    //获取链接代表的参数
    parseTarget: function(target, e, isFormSubmit) { //{{{
      //链接本身的地址
      var self = this,
      conf = self.config,
      href = target.attr('href'),

      //链接的自定义属性指定的接口地址（可能为空）
      intfAttr = conf.intfAttr,
      attrVal = target.attr(intfAttr),

      //点击链接(提交表单)后应该跳转到的url地址
      url = href,

      //接口地址(默认为空)
      intfUrl = BLANK,

      //载入完成滚动到的区域
      scrollTo = BLANK,

      //处理出来的结果
      ret;

      var intf = conf.intf;

      if (isFormSubmit) {
        var formNode = target, form = formNode[0],
        elems = form.elements,
        action = form.action, formInputs = {};

        if (S.isFunction(conf.beforeSubmit)) {
          conf.beforeSubmit.call(self, form);
        }

        //拼接请求地址
        S.each(elems, function(item) {
          var name = item.name, value = item.value;
          if (name) formInputs[name] = encodeURL(value);
        });

        url = action;

        if (!S.isEmptyObject(formInputs)) {
          url += _url_plus(action) + S.param(formInputs);
        }
      }

      //对于特殊的链接，我们不处理
      if (!url || /^(#|javascript:)/.test(url)) return;

      //如果接口定义是一个函数
      //执行这个函数并从返回值中获取接口地址信息
      if (S.isFunction(intf)) {
        ret = intf.call(self, target, e);
        S.isObject(ret) ? ret.scrollTo = scrollTo : BLANK;
        return ret;
      }

      if (PAT_HASH.test(url)) {
        scrollTo = url.match(PAT_HASH)[0];
        url = url.replace(scrollTo, BLANK);
      } else {
        scrollTo = conf.scollTo;
      }

      intfUrl = self.getIntfUrl(url);

      return {
        scrollTo: scrollTo,
        intfUrl: intfUrl,
        url: url
      };
    },
    //}}}

    //判断数据、发请求、进行渲染和回调等后续操作
    doRequest: function(evtData) { //{{{
      var self = this,
      conf = self.config,
      targetContainer = self.target,
      loadingCls = conf.loadingCls;

      if (evtData.data) {
        evtData.hasCache = true;
      }

      //触发载入开始的事件绑定
      self.fire(_START, evtData);

      if (evtData.hasCache) {
        //如果已经有data可用，咱就直接用吧
        self.render(evtData);
        //返回true，以标识是直接渲染
        return true;
      }

      var url = evtData.url,
      intfUrl = evtData.intfUrl,
      guid = evtData.guid,
      target = evtData.target,
      queueId = guid + '||' + intfUrl;

      //插入队列
      self[_QUEUE].push(queueId);

      //触发载入开始的事件绑定
      self.fire(_LOAD, evtData);

      //添加加载中的class
      targetContainer.addClass(loadingCls);
      self.isLoading = true;

      //----------------发起AJAX请求//{{{
      S.io({
        url: intfUrl,
        success: function(ret) {
          evtData.data = ret;
          self.isLoading = false;
          targetContainer.removeClass(loadingCls);

          //_log(ret);
          if (!ret) {
            self.fire(_ERROR, evtData);
            return;
          }

          var cacheLife = self.config.cacheLife * 60000;

          //将data存入缓存
          dataCache[url] = ret;

          //缓存过时后要删除它
          S.later(function() {
            delete dataCache[url];
          }, cacheLife);

          //如果这次载入的数据并未被抢占
          if (!self.checkQueue(queueId)) self.render(evtData);

          //触发获取数据完成的事件绑定
          self.fire(_LOADED, evtData);
        },
        complete: function(ret, status) {
          self.isLoading = false;
          targetContainer.removeClass(loadingCls);
        },
        error: function(ret) {
          self.isLoading = false;
          targetContainer.removeClass(loadingCls);

          evtData.data = ret;

          //触发载入完成的事件绑定
          self.fire(_ERROR, evtData);

        },
        dataType: self.config.dataType
      });//}}}
    },
    //}}}

    render: function(evtData) {
      this.fire(_RENDER, evtData);
    },

    //直接根据要push到地址栏的url载入内容
    load: function(url) {
      this.doRequest({
        url: url,
        intfUrl: this.getIntfUrl(url),
        noPushState: true,
        data: CuteLink.data[url]
      });
    },

    reset: function() {
      self[_QUEUE] = [];
    }
  });

  //注册页面中某个区域为cutelink需要处理的区域
  S.augment(CuteLink, {
    register: function(config) {
      var camp = new CuteCamp(config);
      //存储实例的引用
      CuteLink.camps.push(this.camps[camp.id] = camp);

      //builder is some (new CuteLink())
      camp.builder = this;

      return camp;
    }
  });
});
