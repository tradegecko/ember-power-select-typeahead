import Ember from 'ember';
import layout from '../../templates/components/power-select-typeahead/trigger';

const { isBlank, run, get, computed } = Ember;

export default Ember.Component.extend({
  layout: layout,
  tagName: '',

  // CPs
  text: computed('selected', 'extra.labelPath', {
    get() { return this.getSelectedAsText(); },
    set(_, v) { return v; }
  }),

  // Lifecycle hooks
  didUpdateAttrs({ oldAttrs, newAttrs }) {
    this._super(...arguments);
    /*
     * We need to update the input field with value of the selected option whenever we're closing
     * the select box. But we also close the select box when we're loading search results and when
     * we remove input text -- so protect against this
     */
    if (oldAttrs.select.isOpen && !newAttrs.select.isOpen && !newAttrs.loading && newAttrs.searchText) {
      this.set('text', this.getSelectedAsText());
    }

    if (newAttrs.lastSearchedText !== oldAttrs.lastSearchedText) {
      if (isBlank(newAttrs.lastSearchedText)) {
        run.schedule('actions', null, newAttrs.select.actions.close, null, true);
      } else {
        run.schedule('actions', null, newAttrs.select.actions.open);
      }
    } else if (!isBlank(newAttrs.lastSearchedText) && get(this, 'options.length') === 0 && this.get('loading')) {
      run.schedule('actions', null, newAttrs.select.actions.close, null, true);
    } else if (oldAttrs.loading && !newAttrs.loading && newAttrs.options.length > 0) {
      run.schedule('actions', null, newAttrs.select.actions.open);
    }
  },

  // Actions
  actions: {
    stopPropagation(e) {
      e.stopPropagation();
    },

    handleKeydown(e) {
      let isLetter = e.keyCode >= 48 && e.keyCode <= 90 || e.keyCode === 32; // Keys 0-9, a-z or SPACE
      let isSpecialKeyWhileClosed = !isLetter && !this.get('select.isOpen') && [13, 27, 38, 40].indexOf(e.keyCode) > -1;
      if (isLetter || isSpecialKeyWhileClosed) {
        let select = this.get('select');
        if (!select.isOpen && this.get('loadingMessage')) {
          run.schedule('actions', null, select.actions.open);
        }
        e.stopPropagation();
      }
    },

    handleInputLocal(e) {
      this.get('handleInput')(e);
      this.set('text', e.target.value);
    }
  },

  // Methods
  getSelectedAsText() {
    let labelPath = this.get('extra.labelPath');
    if (labelPath) {
      return this.get('selected.' + labelPath);
    } else {
      return this.get('selected');
    }
  }
});
