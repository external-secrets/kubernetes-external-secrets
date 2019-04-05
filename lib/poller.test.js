/* eslint-env mocha */
'use strict';

const { expect } = require('chai');
const sinon = require('sinon');

const Poller = require('./poller');

describe('Poller', () => {
  let backendMock;
  let kubeClientMock;
  let loggerMock;
  let poller;

  beforeEach(() => {
    backendMock = sinon.mock();
    kubeClientMock = sinon.mock();
    loggerMock = sinon.mock();

    loggerMock.info = sinon.stub();
    loggerMock.error = sinon.stub();

    poller = new Poller({
      backends: {
        fakeBackendType: backendMock
      },
      intervalMilliseconds: 5000,
      kubeClient: kubeClientMock,
      logger: loggerMock,
      namespace: 'fakeNamespace'
    });
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('_createSecretManifest', () => {
    beforeEach(() => {
      backendMock.getSecretManifestData = sinon.stub();
    });

    it('creates secret manifest', async () => {
      backendMock.getSecretManifestData.resolves({
        fakePropertyName1: 'ZmFrZVByb3BlcnR5VmFsdWUx', // base 64 value
        fakePropertyName2: 'ZmFrZVByb3BlcnR5VmFsdWUy'  // base 64 value
      });

      const secretManifest = await poller._createSecretManifest({
        secretDescriptor: {
          backendType: 'fakeBackendType',
          name: 'fakeSecretName',
          properties: [
            'fakePropertyName1',
            'fakePropertyName2'
          ]
        }
      });

      expect(backendMock.getSecretManifestData.calledWith({
        secretDescriptor: {
          backendType: 'fakeBackendType',
          name: 'fakeSecretName',
          properties: [
            'fakePropertyName1',
            'fakePropertyName2'
          ]
        }
      })).to.be.true;

      expect(secretManifest).deep.equals({
        apiVersion: 'v1',
        kind: 'Secret',
        metadata: {
          name: 'fakeSecretName'
        },
        type: 'Opaque',
        data: {
          fakePropertyName1: 'ZmFrZVByb3BlcnR5VmFsdWUx', // base 64 value
          fakePropertyName2: 'ZmFrZVByb3BlcnR5VmFsdWUy'  // base 64 value
        }
      });
    });
  });

  describe('_poll', () => {
    beforeEach(() => {
      poller._secretDescriptors = [
        { backendType: 'fakeBackendType', name: 'fakeSecretName1', properties: ['fakePropertyName1', 'fakePropertyName2'] },
        { backendType: 'fakeBackendType', name: 'fakeSecretName2', properties: ['fakePropertyName3', 'fakePropertyName4'] }
      ];
      poller._upsertKubernetesSecret = sinon.stub();
    });

    it('polls secrets', async () => {
      poller._upsertKubernetesSecret.resolves();

      await poller._poll();

      expect(loggerMock.info.calledWith('running poll')).to.be.true;
      expect(poller._upsertKubernetesSecret.calledWith({
        secretDescriptor: {
          backendType: 'fakeBackendType',
          name: 'fakeSecretName1',
          properties: [
            'fakePropertyName1',
            'fakePropertyName2'
          ]
        }
      })).to.be.true;
      expect(poller._upsertKubernetesSecret.calledWith({
        secretDescriptor: {
          backendType: 'fakeBackendType',
          name: 'fakeSecretName2',
          properties: [
            'fakePropertyName3',
            'fakePropertyName4'
          ]
        }
      })).to.be.true;
    });

    it('logs error if storing secret operation fails', async () => {
      poller._upsertKubernetesSecret.throws(new Error('fake error message'));

      await poller._poll();

      expect(loggerMock.error.calledWith('failure while polling the secrets')).to.be.true;
    });
  });

  describe('_upsertKubernetesSecret', () => {
    let kubeNamespaceMock;
    let upsertSecretParams;

    beforeEach(() => {
      kubeNamespaceMock = sinon.mock();
      kubeNamespaceMock.secrets = sinon.stub().returns(kubeNamespaceMock);
      kubeClientMock.api = sinon.mock();
      kubeClientMock.api.v1 = sinon.mock();
      kubeClientMock.api.v1.namespaces = sinon.stub().returns(kubeNamespaceMock);
      poller._createSecretManifest = sinon.stub().returns({
        apiVersion: 'v1',
        kind: 'Secret',
        metadata: {
          name: 'fakeSecretName'
        },
        type: 'Opaque',
        data: {
          fakePropertyName: 'ZmFrZVByb3BlcnR5VmFsdWU='
        }
      });
      upsertSecretParams = {
        secretDescriptor: {
          backendType: 'fakeBackendType',
          name: 'fakeSecretName',
          properties: ['fakePropertyName1']
        }
      };
    });

    it('creates new secret', async () => {
      kubeNamespaceMock.secrets.post = sinon.stub().resolves();

      await poller._upsertKubernetesSecret(upsertSecretParams);

      expect(kubeNamespaceMock.secrets.post.calledWith({
        body: {
          apiVersion: 'v1',
          kind: 'Secret',
          metadata: {
            name: 'fakeSecretName'
          },
          type: 'Opaque',
          data: {
            fakePropertyName: 'ZmFrZVByb3BlcnR5VmFsdWU='
          }
        }
      })).to.be.true;
    });

    it('updates secret', async () => {
      const conflictError = new Error('Conflict');
      conflictError.statusCode = 409;
      kubeNamespaceMock.secrets.post = sinon.stub().throws(conflictError);
      kubeNamespaceMock.put = sinon.stub().resolves();

      await poller._upsertKubernetesSecret(upsertSecretParams);

      expect(kubeNamespaceMock.secrets.calledWith('fakeSecretName')).to.be.true;
      expect(kubeNamespaceMock.put.calledWith({
        body: {
          apiVersion: 'v1',
          kind: 'Secret',
          metadata: {
            name: 'fakeSecretName'
          },
          type: 'Opaque',
          data: {
            fakePropertyName: 'ZmFrZVByb3BlcnR5VmFsdWU='
          }
        }
      })).to.be.true;
    });

    it('fails storing secret', async () => {
      const internalErrorServer = new Error('Internal Error Server');
      internalErrorServer.statusCode = 500;

      kubeNamespaceMock.secrets.post = sinon.stub().throws(internalErrorServer);

      let error;

      try {
        await poller._upsertKubernetesSecret(upsertSecretParams);
      } catch (err) {
        error = err;
      }

      expect(error).to.be.not.undefined;
      expect(error.message).equals('Internal Error Server');
    });
  });

  describe('start', () => {
    let clock;

    beforeEach(() => {
      clock = sinon.useFakeTimers();
      poller._poll = sinon.stub();
    });

    afterEach(() => {
      poller.stop();
      clock.restore();
    });

    it('starts poller', async () => {
      expect(poller._interval).to.be.null;
      poller.start();
      clock.tick(poller._intervalMilliseconds);
      expect(loggerMock.info.calledWith('starting poller')).to.be.true;
      expect(poller._interval).to.not.be.null;
      expect(poller._poll.called).to.be.true;
    });
  });

  describe('stop', () => {
    let clock;

    beforeEach(() => {
      clock = sinon.useFakeTimers();
      poller._poll = sinon.stub();
    });

    afterEach(() => {
      clock.restore();
    });

    it('stops poller', async () => {
      poller.start();
      poller.stop();
      expect(loggerMock.info.calledWith('stopping poller')).to.be.true;
      expect(poller._interval).to.be.null;
    });
  });
});
