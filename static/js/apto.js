var APTo = {
  option: function() {
    return {
      oid: '',
      oname: '',
      oorder: 0,
      ocmd: ''
    };
  },
  repository: function() {
    return this.option();
  },
  package: function() {
    var obj = this.option();
    obj['orepo'] = '';
    obj['otag'] = '';
    return obj;
  }
};
(function($) {
  $.fn.checkButton = function() {
    this.click(function() {
      var checkbox = $(this).children('input:checkbox');
      checkbox.prop('checked', !checkbox.prop('checked'));
      checkbox.change();
    });
    this.children('input:checkbox').change(function() {
      if ($(this).prop('checked'))
        $(this).parent('div.box').addClass('selected');
      else
        $(this).parent('div.box').removeClass('selected');
    }).change();
    return this;
  };
  $('div.box.btn-checkbox').checkButton();
}(jQuery));
$(function($) {
  $.fn.oStored = function(fnRef) {
    var elements = [];
    var code = this.find('div.panel-code textarea');
    this.find('div.panel-show div.box input:checkbox').each(function() {
      var obj = {};
      var ref = fnRef.call(APTo);
      for (k in ref)
        if (typeof ref[k] !== 'number')
          obj[k] = $(this).attr(k);
        else
          obj[k] = Number($(this).attr(k));
      elements.push(JSON.stringify(obj));
    });
    code.val("[\n  " + elements.join(",\n  ") + "\n]");
    return this;
  };
  $.fn.oStore = function(fnRef) {
    var show = this.children('div.panel-show');
    var code = this.find('div.panel-code textarea');
    if ($.trim(code.val()) !== '') {
      var json, name, tmp, tag;
      try {
        json = $.parseJSON($.trim(code.val()));
        if (!$.isArray(json))
          throw "";
      } catch (err) {
        throw "JSON debe ser de la forma: " + JSON.stringify([fnRef.call(APTo)]);
      }
      json.sort(function(a, b) {
        if (a.oorder > b.oorder) {
          return 1;
        } else if (a.oorder < b.oorder) {
          return -1;
        } else {
          var nameA = (a.oname === '' ? a.oid : a.oname).toUpperCase();
          var nameB = (b.oname === '' ? b.oid : b.oname).toUpperCase();
          var tagA = (a.otag === undefined ? '' : a.otag);
          var tagB = (b.otag === undefined ? '' : b.otag);
          if (tagA + nameA > tagB + nameB)
            return 1;
          else if (tagA + nameA < tagB + nameB)
            return -1;
          else
            return 0;
        }
      });
      show.html('');
      for (k in json) {
        tmp = $.extend(fnRef.call(APTo), json[k]);
        name = tmp.oname === '' ? tmp.oid : tmp.oname;
        if (tmp.otag !== undefined) {
          tag = show.find('div[otag="' + tmp.otag + '"] div.panel-body');
          if (tag.length == 0) {
            show.append($('<div>', {
              otag: tmp.otag
            }).append($('<div>').addClass('panel-header no-border').append($('<input>', {
              type: 'checkbox',
              id: tmp.otag
            })).append($('<label>', {
              for: tmp.otag
            }).html(tmp.otag))).append($('<div>').addClass('panel-body')));
            tag = show.find('div[otag="' + tmp.otag + '"] div.panel-body');
          }
          tag.append($('<div>').addClass('box btn-checkbox fluid').append($('<input>', {
            type: 'checkbox',
            id: tmp.oid
          }).attr(tmp)).append($('<label>', {
            for: tmp.oid
          }).html(name)));
        } else {
          show.append($('<div>').addClass('box btn-checkbox fluid').append($('<input>', {
            type: 'checkbox',
            id: tmp.oid
          }).attr(tmp)).append($('<label>', {
            for: tmp.oid
          }).html(name)));
        }
      }
      this.find('div.box.btn-checkbox').checkButton();
      code.val('');
    }
    return this;
  };
  $.fn.tagChange = function() {
    this.find('div.panel-header input:checkbox').change(function() {
      $('input[otag="' + $(this).attr('id') + '"]').prop('checked', $(this).prop('checked')).change();
    }).change();
    return this;
  };
  $.fn.packageChange = function() {
    this.find('div.box input:checkbox').change(function() {
      if ($(this).prop('checked') && $(this).attr('orepo') !== '')
        $('div.box input[oid="' + $(this).attr('orepo') + '"]').prop('checked', $(this).prop('checked')).change();
      else if (!$(this).prop('checked'))
        $('#' + $(this).attr('otag')).prop('checked', $(this).prop('checked'));
    }).change();
    return this;
  };
  $.fn.repoChange = function() {
    this.find('div.box input:checkbox').change(function() {
      if ($(this).prop('checked'))
        $('div.box input[oid="update"]:checkbox').prop('checked', true).change();
      else
        $('div.box input[orepo="' + $(this).attr('oid') + '"]:checkbox').prop('checked', $(this).prop('checked')).change();
    });
    return this;
  };
  $.fn.optionChange = function() {
    this.find('div.box input:checkbox').change(function() {
      if (!$(this).prop('checked') && $(this).attr('oid') === 'update')
        $('#repositories div.box input:checkbox').prop('checked', $(this).prop('checked')).change();
    });
    return this;
  };
  $.fn.generate = function() {
    this.change(function() {
      var doc = "# -*- ENCODING: UTF-8 -*-\n#!/bin/bash\nclear\nsudo -s <<APTO\n";
      var cmd = '';
      $('#options div.box input:checkbox').each(function() {
        if ($(this).attr('oid') === 'update' && $(this).prop('checked')) {
          $('#repositories div.box input:checkbox:checked').each(function() {
            cmd += $(this).attr('ocmd') + ' && ';
          });
          cmd += $(this).attr('ocmd') + ' && ';
        } else if ($(this).attr('oid') === 'upgrade') {
          if ($(this).prop('checked'))
            cmd += $(this).attr('ocmd') + ' && ';
          var packages = '';
          $('#packages div.box input:checkbox:checked').each(function() {
            packages += $(this).attr('ocmd') + ' ';
          });
          packages = (packages !== '' ? 'apt-get install -y ' + packages + '&& ' : '');
          cmd += packages;
        } else if ($(this).prop('checked')) {
          cmd += ($(this).attr('ocmd')) + ' && ';
        }
      });
      if (cmd !== '') {
        doc += cmd + "echo 'Instalación finalizada'\nAPTO";
        $('#btn-download').attr('href', 'data:text/plain;charset=UTF-8,' + encodeURIComponent(doc));
      } else {
        $('#btn-download').attr('href', '#');
      }
    }).change();
    return this;
  };
}(jQuery));
$(function() {
  $('#packages').tagChange().packageChange();
  $('#repositories').repoChange();
  $('#options').optionChange();
  $('div.box input:checkbox').generate();
  $('#btn-edit').click(function() {
    $('#options').oStored(APTo.option);
    $('#repositories').oStored(APTo.repository);
    $('#packages').oStored(APTo.package);
    $(this).addClass('hidden');
    $('div.panel-show').addClass('hidden');
    $('div.panel-code, #btn-save, #btn-cancel').removeClass('hidden');
  });
  $('#btn-save').click(function() {
    try {
      $('#options').oStore(APTo.option).optionChange();
      $('#repositories').oStore(APTo.repository).repoChange();
      $('#packages').oStore(APTo.package).tagChange().packageChange();
      $('div.box input:checkbox').generate();
      $(this).addClass('hidden');
      $('div.panel-show, #btn-edit').removeClass('hidden');
      $('div.panel-code, #btn-cancel').addClass('hidden');
    } catch (err) {
      alert(err);
    }
  });
  $('#btn-cancel').click(function() {
    $(this).addClass('hidden');
    $('div.panel-show, #btn-edit').removeClass('hidden');
    $('div.panel-code, #btn-save').addClass('hidden');
    $('div.panel-code textarea').val('');
  });
});
