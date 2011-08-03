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
    //һ��url ��Ӧ�������ݵĵ��ö���
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
    //��ȡ��ǰ����ʵ��ַ
    getCrtUrl: function() {
      return CuteLink.getCleanUrl(win.location.href);
    },

    //��
    start: function() {
      var self = this;

      if (self.started) return;

      self.started = true;

      var current = self.getCrtUrl();
      //oldIE = (S.UA.ie < 8);

      //if (oldIE) {
      ////����iframe������״̬
      //var iframe = D.create('<iframe style="position: absolute; left: -999px; top: -999px; visibility: hidden;" height="20" scroll="yes" src="javascript:0" tabindex="-1" />');
      //document.body.appendChild(iframe);
      //self.iframe = iframe.contentWindow;

      //var frameDoc = self.iframe.document;

      //frameDoc.open();
      ////��iframe �ڴ��ڵ� scroll�¼�
      //frameDoc.write('<html><body><style> div { height: 20px; overflow: hidden; } </style><div></div><script> window.onscroll = function() { try { var hist = parent.window.KISSY.CuteLink.history, elems = document.getElementsByTagName("div"), i = Math.floor(document.body.scrollTop / 20), url = elems[i].id; if (!url) return; hist.setHash(url, 1); hist.checkurl(url); } catch (e) {} } </script></body></html>');
      //frameDoc.close();

      //}

      if (_hasPushState) {
        E.on(win, 'popstate', function() { self.checkUrl(); });
      } else if ('onhashchange' in window) {
        E.on(win, 'hashchange', function() { self.checkUrl(); });
      } else {
        //��ʱ���hash���
        //S.later(self.checkUrl, 50, true, self);
      }

      self.current = current;
      self._hasPushState = _hasPushState;
    },

    //�Բ�֧��pushState�������������location.hash (��ִ������)
    setHash: function(url, fromFrame) {
      var self = this;
      //iframe = self.iframe;

      //�Բ�֧��hashchange��ҳ�棬����iframe hash��������ʷ
      //if (iframe && !fromFrame) {
      //var frameDoc = iframe.document,
      //tagger = frameDoc.createElement('div');

      //tagger.id = url;

      ////������location �ٹ���
      //frameDoc.location.hash = url;

      //frameDoc.body.appendChild(tagger);

      //}

      //�����ǰ��ַ��
      setLocHash(url);
    },

    navigate: function(url, trigger, evtData) {
      var self = this;

      //���ָ������˭�����Ĵ��¼�
      //����handlers����
      if (trigger) {
        self.prevHandler = self.handlers[url] = [trigger, evtData];
      }

      //�����window.history.pushState���� �� pushState
      //���û�У����� url hash ����
      // title �� state ֵ������ʱû�õ�
      if (self._hasPushState) {
        win.history.pushState(null, null, url);
      } else {
        self.setHash(url);
      }

      self.checkUrl(url);
    },

    //�������е�url����ĳ��ַ
    loadUrl: function(url) {
      var handler = this.handlers[url], trigger, evtData;

      //Ĭ�ϸ���urlȡtrigger
      //���ȡ������������һ��trigger�����뵱ǰurl
      if (handler) {
        trigger = handler[0];
        evtData = handler[1];
      } else {
        handler = this.prevHandler;
        trigger = (handler && handler[0]) || CuteLink.defaultCamp;
      }

      //���ָ����evtData ʹ��evtData������
      if (evtData) {
        //data��cutelink����������ȡ
        evtData.data = CuteLink.data[url];
        evtData.hasCache = !S.isUndefined(evtData.data);
        trigger.doRequest(evtData);
      } else if (trigger) {
        //����ֱ��load url
        //ֱ��load�Ľ���ǲ�֪�����load����ʲô����������
        trigger.load(url);
      }
    },

    checkUrl: function(url) {
      var self = this,
      crt = url || self.getCrtUrl();

      if (crt == self.current) return false;

      //��url��һ��ʱ���͸�����
      self.current = crt;
      self.loadUrl(crt);
    },

    //�жϵ�ǰlocation�Ƿ���з��ϸ�ʽ��hashtag
    //���У�����ݴ�hash��ת����ʵURL
    locCheck: function() {
      var loc = win.location;
      if (loc.hash.indexOf(HASH_LEAD) == -1) return;
      loc.href = this.current;
    }
  });

  CuteLink.history = new CuteLink.History();

  CuteLink.history.start();
});
