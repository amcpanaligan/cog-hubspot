import { Struct } from 'google-protobuf/google/protobuf/struct_pb';
import * as chai from 'chai';
import { default as sinon } from 'ts-sinon';
import * as sinonChai from 'sinon-chai';
import 'mocha';

import { Step as ProtoStep, StepDefinition, FieldDefinition, RunStepResponse } from '../../../src/proto/cog_pb';
import { Step } from '../../../src/steps/contact/contact-create-or-update';

chai.use(sinonChai);

describe('CreateOrUpdateContactStep', () => {
  const expect = chai.expect;
  let protoStep: ProtoStep;
  let stepUnderTest: Step;
  let clientWrapperStub: any;

  beforeEach(() => {
    protoStep = new ProtoStep();
    clientWrapperStub = sinon.stub();
    clientWrapperStub.createOrUpdateContact = sinon.stub();
    clientWrapperStub.getContactByEmail = sinon.stub();
    clientWrapperStub.toEpoch = sinon.stub();
    clientWrapperStub.toEpoch.returns(new Date().valueOf());
    clientWrapperStub.toDate = sinon.stub();
    clientWrapperStub.toDate.returns(new Date().toISOString());
    stepUnderTest = new Step(clientWrapperStub);
  });

  describe('Metadata', () => {
    it('should return expected step metadata', () => {
      const stepDef: StepDefinition = stepUnderTest.getDefinition();
      expect(stepDef.getStepId()).to.equal('CreateOrUpdateContactStep');
      expect(stepDef.getName()).to.equal('Create or update a HubSpot contact');
      expect(stepDef.getExpression()).to.equal('create or update a hubspot contact');
      expect(stepDef.getType()).to.equal(StepDefinition.Type.ACTION);
    });

    it('should return expected step fields', () => {
      const stepDef: StepDefinition = stepUnderTest.getDefinition();
      const fields: any[] = stepDef.getExpectedFieldsList().map((field: FieldDefinition) => {
        return field.toObject();
      });

      expect(fields[0].key).to.equal('contact');
      expect(fields[0].optionality).to.equal(FieldDefinition.Optionality.REQUIRED);
      expect(fields[0].type).to.equal(FieldDefinition.Type.MAP);
    });
  });

  describe('ExecuteStep', () => {
    describe('Expected Parameters', () => {
      it('should call createOrUpdateContact with expected email and contact', async () => {
        const expectedEmail: string = 'hubspot@test.com';
        const contact = {
          email: expectedEmail,
        };
        const expectedContact: Object = { properties: [] };
        Object.keys(contact).forEach((key) => {
          expectedContact['properties'].push({
            property: key,
            value: contact[key],
          });
        });
        protoStep.setData(Struct.fromJavaScript({
          contact,
        }));

        await stepUnderTest.executeStep(protoStep);
        expect(clientWrapperStub.createOrUpdateContact).to.have.been.calledWith(
            expectedEmail, expectedContact);
      });
    });

    describe('Contact successfully created or updated', () => {
      beforeEach(() => {
        protoStep.setData(Struct.fromJavaScript({
          // tslint:disable-next-line:max-line-length
          contact:  { email: 'hubspot@test.com', closedate: '2020-06-26T04:00:00.000Z', properties: { createdate: new Date().valueOf(), lastmodifieddate: new Date().valueOf() } },
        }));
        clientWrapperStub.createOrUpdateContact.returns(Promise.resolve({}));
        clientWrapperStub.getContactByEmail.returns(Promise.resolve({
          properties: {
            createdate: 'someDate',
            lastmodifieddate: 'someDate',
          },
        }));
      });

      it('should respond with pass', async () => {
        const response: RunStepResponse = await stepUnderTest.executeStep(protoStep);
        expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.PASSED);
      });
    });

    describe('Contact not created nor updated', () => {
      beforeEach(() => {
        protoStep.setData(Struct.fromJavaScript({
          contact:  {
            email: 'hubspot@test.com',
            properties: {
              createdate: { value: new Date().valueOf() },
              lastmodifieddate: { value: new Date().valueOf() },
            },
          },
        }));
        clientWrapperStub.createOrUpdateContact.returns(Promise.resolve(undefined));
        clientWrapperStub.getContactByEmail.returns(Promise.resolve({
          properties: {
            createdate: 'someDate',
            lastmodifieddate: 'someDate',
          },
        }));
      });

      it('should respond with fail', async () => {
        const response: RunStepResponse = await stepUnderTest.executeStep(protoStep);
        expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.FAILED);
      });
    });

    describe('Error occurred', () => {
      beforeEach(() => {
        protoStep.setData(Struct.fromJavaScript({
          // tslint:disable-next-line:max-line-length
          contact:  {
            email: 'hubspot@test.com',
            properties: {
              createdate: { value: new Date().valueOf() },
              lastmodifieddate: { value: new Date().valueOf() },
            },
          },
        }));
        clientWrapperStub.createOrUpdateContact.returns(Promise.reject('Error'));
      });

      it('should respond with error', async () => {
        const response: RunStepResponse = await stepUnderTest.executeStep(protoStep);
        expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.ERROR);
      });
    });
  });
});
