/**
* [History Manager]
*
* to set location.href and make history.
*
* need config.pushState to be true when register a new basecamp.
*
* TODO: IE6, IE7 support.
* could've used iframe, but too tricky and unstable.
*
*/
KISSY.add('cutelink/history', function(S, undefined) {
  var win = window,
  doc = document,
  $ = S.all,
  E = S.Event,
  D = S.DOM,
  CuteLink = S.CuteLink;

  var HASH_LEAD = '#!',
  PAT_HASH = /#[^#]*$/,
  __CLRMS = '__clrms',
  BLANK = '',
  _hasPushState = !!(win.history && win.history.pushState);

  CuteLink.History = function() {
    //一个url 对应这项数据的调用对象
    this.handlers = {};
  };

  function setLocHash(hashUrl, loc) {
    var loc = loc || win.location;
    if (hashUrl === BLANK) {
      if (loc.hash) loc.href = loc.href.replace(PAT_HASH, BLANK);
    } else {
      loc.hash = HASH_LEAD + hashUrl;
    }
  }

  S.augment(CuteLink.History, S.EventTarget, {
    //获取当前的真实地址
    getCrtUrl: function() {
      return CuteLink.getCleanUrl(win.location.href);
    },

    //绑定
    start: function() {
      var self = this;

      if (self.started) return;

      self.started = true;

      var current = self.getCrtUrl();
      //oldIE = (S.UA.ie < 8);

      //if (oldIE) {
      ////创建iframe来保持状态
      //var iframe = D.create('<iframe style="position: absolute; left: -999px; top: -999px; visibility: hidden;" height="20" scroll="yes" src="javascript:0" tabindex="-1" />');
      //document.body.appendChild(iframe);
      //self.iframe = iframe.contentWindow;

      //var frameDoc = self.iframe.document;

      //frameDoc.open();
      ////绑定iframe 内窗口的 scroll事件
      //frameDoc.write('<html><body><style> div { height: 20px; overflow: hidden; } </style><div></div><script> window.onscroll = function() { try { var hist = parent.window.KISSY.CuteLink.history, elems = document.getElementsByTagName("div"), i = Math.floor(document.body.scrollTop / 20), url = elems[i].id; if (!url) return; hist.setHash(url, 1); hist.checkurl(url); } catch (e) {} } </script></body></html>');
      //frameDoc.close();

      //}

      if (_hasPushState) {
        E.on(win, 'popstate', function() { self.checkUrl(); });
      } else if ('onhashchange' in window) {
        E.on(win, 'hashchange', function() { self.checkUrl(); });
      } else {
        //定时检查hash变更
        //S.later(self.checkUrl, 50, true, self);
      }

      self.current = current;
      self._hasPushState = _hasPushState;
    },

    //对不支持pushState的浏览器，设置location.hash (并执行载入)
    setHash: function(url, fromFrame) {
      var self = this;
      //iframe = self.iframe;

      //对不支持hashchange的页面，设置iframe hash来保存历史
      //if (iframe && !fromFrame) {
      //var frameDoc = iframe.document,
      //tagger = frameDoc.createElement('div');

      //tagger.id = url;

      ////先设置location 再滚动
      //frameDoc.location.hash = url;

      //frameDoc.body.appendChild(tagger);

      //}

      //变更当前地址栏
      setLocHash(url);
    },

    navigate: function(url, trigger, evtData) {
      var self = this;

      //如果指定了是谁触发的此事件
      //存入handlers缓存
      if (trigger) {
        self.prevHandler = self.handlers[url] = [trigger, evtData];
      }

      //如果有window.history.pushState方法 则 pushState
      //如果没有，则用 url hash 处理
      // title 和 state 值基本上时没用的
      if (self._hasPushState) {
        win.history.pushState(null, null, url);
      } else {
        self.setHash(url);
      }

      self.checkUrl(url);
    },

    //根据已有的url载入某地址
    loadUrl: function(url) {
      var handler = this.handlers[url], trigger, evtData;

      //默认根据url取trigger
      //如果取不到，则用上一个trigger来载入当前url
      if (handler) {
        trigger = handler[0];
        evtData = handler[1];
      } else {
        handler = this.prevHandler;
        trigger = (handler && handler[0]) || CuteLink.defaultCamp;
      }

      //如果指定了evtData 使用evtData来加载
      if (evtData) {
        //data从cutelink缓存里重新取
        evtData.data = CuteLink.data[url];
        evtData.hasCache = !S.isUndefined(evtData.data);
        trigger.doRequest(evtData);
      } else if (trigger) {
        //否则直接load url
        //直接load的结果是不知道这次load是由什么操作所触发
        trigger.load(url);
      }
    },

    checkUrl: function(url) {
      var self = this,
      crt = url || self.getCrtUrl();

      if (crt == self.current) return false;

      //当url不一样时，就更新它
      self.current = crt;
      self.loadUrl(crt);
    },

    //判断当前location是否具有符合格式的hashtag
    //如有，则根据此hash跳转到真实URL
    locCheck: function() {
      var loc = win.location;
      if (loc.hash.indexOf(HASH_LEAD) == -1) return;
      loc.href = this.current;
    }
  });

  //start a new history manager instance.
  CuteLink.history = new CuteLink.History();

  CuteLink.history.start();
});
