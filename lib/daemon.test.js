/* eslint-env mocha */
'use strict';

const { expect } = require('chai');
const sinon = require('sinon');

const Daemon = require('./daemon');
const Poller = require('./poller');

describe('Daemon', () => {
  let daemon;
  let loggerMock;

  beforeEach(() => {
    loggerMock = sinon.mock();
    loggerMock.info = sinon.stub();

    daemon = new Daemon({
      logger: loggerMock,
      pollerIntervalMilliseconds: 0
    });
  });

  afterEach(() => {
    sinon.restore();
  });

  it('starts new pollers for external secrets', async () => {
    sinon.stub(Poller.prototype, 'start')
      .callsFake(function () { return this; });
    sinon.stub(Poller.prototype, 'stop')
      .callsFake(function () { return this; });

    const fakeExternalSecretEvents = (async function *() {
      yield {
        type: 'ADDED',
        object: {
          metadata: {
            name: 'foo',
            namespace: 'foo',
            resourceVersion: '1'
          },
          secretDescriptor: {}
        }
      };
    }());
    daemon._externalSecretEvents = fakeExternalSecretEvents;

    await daemon.start();
    daemon.stop();

    expect(Poller.prototype.start.called).to.be.true;
    expect(Poller.prototype.stop.called).to.be.true;
  });
});
