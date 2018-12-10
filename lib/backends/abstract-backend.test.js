'use strict';

const { expect } = require('chai');

const AbstractBackend = require('./abstract-backend');

describe('AbstractBackend', () => {
  let abstractBackend;

  beforeEach(() => {
    abstractBackend = new AbstractBackend();
  });

  describe('getSecretManifestData', () => {
    it('thows an error', () => {
      let error;

      try {
        abstractBackend.getSecretManifestData();
      } catch (err) {
        error = err;
      }

      expect(error).to.not.be.undefined;
      expect(error.message).equals('getSecretManifestData not implemented');
    });
  });
});
