/**
* CuteLink v{#VERSION}
*
* Date: {#DATE}
*
* Copyright given up 2011, Jianchao Yang.
*
* You can do whatever you want with this.
*
*/

//Extend KISSY
(function(S) {
  S.mix(S, {
    /**
    * @param {array} funs ��Ҫִ�еĺ�����һ���ı�����.
    * @param {object} context ����������.
    */
    _invoke: function(funs, context) {
      if (funs)
        for (var i = 0; i < funs.length; i++)
        try {
          (new Function(funs[i])).apply(context);
          _log(funs[i] + '�Ѵ���');
        } catch (a) {}
    },
    /**
    * ֻ���ڿ���ģʽ�£������������Ϣ
    */
    _log: function() {
      if (window._DEV_) S.log.apply(S, arguments);
    }
  });
})(KISSY);

KISSY.add('cutelink', function(S) {
  var _DATA = 'data',
  _PARAMS = 'params';

  //CuteLinkӦ�ù�����
  function CuteLink() {
    var self = this;

    S.mix(self, {
      _inited: false,
      camps: {}, //ͨ��register����ע���ʵ��
      callbacks: {} //ȫ�ֻص��������������ʵ������
    });

    return self;
  }

  //ȫ���ԵĲ�������
  S.mix(CuteLink, {
    camps: [], //���ճ�ʼ��˳�����CuteCamp
    data: {}, //����url�����ݻ���
    params: {} //����·����url��������
  });

  S.augment(CuteLink, S.EventTarget, {
    //��ջ���
    clear: function(cachekeys) {
      if (S.isArray(cachekeys)) {
        S.each(cachekeys, function(key) {
          delete CuteLink[_DATA][key];
        });
      } else {
        CuteLink[_DATA] = {};
      }
    },

    //Ҫ��ʼʹ��cutelink ������ִ��init����
    init: function(conf) {
      var self = this;

      //֧�ָı���������ٶȳ�ʼ��
      if (self._inited && !conf) return self;

      var conf = S.mix({
        //�Ƿ���Ҫ����URL hash��ת
        doRedirect: true
      }, conf);

      //��¼�µ�ǰ��·����������hashtag
      var initialUrl = window.location.href,
      crtLocParam = initialParam = CuteLink.getLocParam(),
      crtLocPath = CuteLink.getUrlPath(initialUrl);

      //�洢��ǰ��ַ����ʵ����
      //���ܴ��� self ��
      CuteLink[_PARAMS][crtLocPath] = crtLocParam;

      var oninit = conf.oninit;
      //���Ҫ��ת��hash��url ����δָ����ʼ��ִ�е��¼�
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
