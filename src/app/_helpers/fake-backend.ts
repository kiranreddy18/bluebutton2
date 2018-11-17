import { Injectable } from '@angular/core';
import { HttpRequest, HttpResponse, HttpHandler, HttpEvent, HttpInterceptor, HTTP_INTERCEPTORS } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { delay, mergeMap, materialize, dematerialize } from 'rxjs/operators';
import { User } from '../_models';
import { Claim } from '../_models';
import { ClaimService } from '../_models';
import { EOB } from '../_models';
import { EOBDetail} from '../_models';
import { ListFormat } from "typescript";
import { UserService } from '../_services';

@Injectable()
export class FakeBackendInterceptor implements HttpInterceptor {

    users: User[] = [];
    eobs: EOB[] = [];
    adjudication =  [];
    itemAdjudication = [[]];
    beneId: string;
    claimId: string;
    claimIndex: number;
  
  
    constructor(userService: UserService) { }

    intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        let testUser = { id: 1, username: 'test', password: 'test', firstName: 'Dave', lastName: 'Holdgrafer' };

        // wrap in delayed observable to simulate server api call
        return of(null).pipe(mergeMap(() => {

            // authenticate
            if (request.url.endsWith('/api/authenticate') && request.method === 'POST') {
                if (request.body.username === testUser.username && request.body.password === testUser.password) {
                    // if login details are valid return 200 OK with a fake jwt token
                    return of(new HttpResponse({ status: 200, body: { token: 'fake-jwt-token' } }));
                } else {
                    // else return 400 bad request
                    return throwError({ error: { message: 'Username or password is incorrect' } });
                }
            }

            // get users
            if (request.url.endsWith('/api/users') && request.method === 'GET') {                 
                let eobsFormattedData = this.formatEOBData();             
                return of(new HttpResponse({ status: 200, body: [eobsFormattedData] }));
            }

            // get EOB Detail
            if (request.url.endsWith('/api/eobdetail') && request.method === 'GET') {
                let eobDetailData = this.formatEOBDetail();
                 return of(new HttpResponse({ status: 200, body: [eobDetailData] }));
            }
            // pass through any requests not handled above
        
            return next.handle(request);
            
        }))

        .pipe(materialize())
        .pipe(delay(500))
        .pipe(dematerialize());
    }
  
    formatEOBData() {
        let jsonData = JSON.parse(localStorage.getItem('eobJSONData'));
        let jsonParsedObject = JSON.parse(JSON.stringify(jsonData)) ;
        let eobNew = new EOB();
        eobNew.claims = [];

        var entry = jsonData["entry"];
        var entryLength = entry.length;
        eobNew.claimCount = this.getNestedObject(jsonData, ['total']);

        var links = this.getNestedObject(jsonData, ['link']);
        if(links && links.length > 0){
            var linkUrlsLen = links.length;

            for(var lk = 0; lk < linkUrlsLen; lk++){
                var linkObj = links[lk];
                var relation = this.getNestedObject(linkObj, ['relation']) ;
                if(relation && relation == 'next'){
                    eobNew.nextClaimStartURL = this.getNestedObject(linkObj, ['url']) ;
                } else if(relation && relation == 'previous'){
                    eobNew.prevClaimStartURL = this.getNestedObject(linkObj, ['url']) ;
                } else if(relation && relation == 'first'){
                    eobNew.firstClaimStartURL = this.getNestedObject(linkObj, ['url']) ;
                } else if(relation && relation == 'last'){
                    eobNew.lastClaimStartURL = this.getNestedObject(linkObj, ['url']) ;
                } else if(relation && relation == 'self'){
                    eobNew.selfClaimStartURL = this.getNestedObject(linkObj, ['url']) ;
                } 
            }
        }

        for(var i=0; i<entryLength; i++){
            let eobEntry = entry[i];
            if(i==0){
                this.beneId = this.getNestedObject(eobEntry, ['resource', 'patient', 'reference']) ;
                var index = this.beneId.indexOf( "/" ); 
                eobNew.beneId = this.beneId.substr(index + 1,15);
                // these are hardcoded for now just for display purposes
                eobNew.firstName = 'John';
                eobNew.lastName = 'Doe';
                eobNew.birthDate = '2014-06-01';
                
            }

            let claim = new Claim();
            claim.billablePeriodStart = this.getNestedObject(eobEntry, ['resource', 'billablePeriod', 'start']) ;
            claim.billablePeriodEnd = this.getNestedObject(eobEntry, ['resource', 'billablePeriod', 'end']) ;     
            this.claimId = this.getNestedObject(eobEntry, ['resource', 'id']) ;
            var index = this.claimId.indexOf( "-" ); 
            claim.id = this.claimId.substr(index + 1);
            claim.type = this.claimId.substr(0,index);
         
            // claim_type_cd and claim_type_cd display          
            claim.typeCode = this.getNestedObject(eobEntry, ['resource', 'type', 'coding', 0, 'code']) ;
            claim.typeCodeDisplay = this.getNestedObject(eobEntry, ['resource', 'type', 'coding', 0, 'display']);
            claim.status = this.getNestedObject(eobEntry, ['resource', 'status']);
            claim.primaryPayerAmount = this.getNestedObject(eobEntry, ['resource', 'extension', 0, 'valueMoney', 'value']);
            claim.deductibleAmount = this.getNestedObject(eobEntry, ['resource', 'extension', 5, 'valueMoney', 'value']);
            claim.providerPayAmount = this.getNestedObject(eobEntry, ['resource', 'extension', 6, 'valueMoney', 'value']);
            claim.benePayment = this.getNestedObject(eobEntry, ['resource', 'extension', 7, 'valueMoney', 'value']);
            claim.submittedCharges = this.getNestedObject(eobEntry, ['resource', 'extension', 8, 'valueMoney', 'value']);
            claim.allowedAmount =  this.getNestedObject(eobEntry, ['resource', 'extension', 9, 'valueMoney', 'value']);
            claim.claimUrl = this.getNestedObject(eobEntry, ['fullUrl']);

            let claimServices = this.getNestedObject(eobEntry, ['resource', 'item']);
            if(claimServices && claimServices.length > 0){
                claim.services = [];
                var serviceLen = claimServices.length;
                for(var j = 0 ; j < serviceLen; j++){
                    let serviceLine = new ClaimService();
                    serviceLine.quantity = this.getNestedObject(claimServices[j], ['quantity', 'value']);
                    serviceLine.sequence = this.getNestedObject(claimServices[j], ['sequence']);
                    serviceLine.servicePeriodStart = this.getNestedObject(claimServices[j], ['servicedPeriod', 'start']);
                    serviceLine.servicePeriodEnd = this.getNestedObject(claimServices[j], ['servicedPeriod', 'end']);
                    serviceLine.serviceCode = this.getNestedObject(claimServices[j], ['service', 'coding', 0, 'code']);
                    serviceLine.categoryCode = this.getNestedObject(claimServices[j], ['category', 'coding', 0, 'code']);
                    serviceLine.categoryDisplay = this.getNestedObject(claimServices[j], ['category', 'coding', 0, 'display']);

                    let adjudication = this.getNestedObject(claimServices[j], ['adjudication']);
                    if(adjudication){
                        var adjLen = adjudication.length;
                        for(var k = 0; k < adjLen; k++){
                            var category = this.getNestedObject(adjudication[k], ['category', 'coding', 0, 'display']);
                            if(category == 'Line Provider Payment Amount'){
                                serviceLine.providerPayment = this.getNestedObject(adjudication[k], ['amount', 'value']);
                            } else
                            if(category.indexOf('Deductible Amount') > 0 ){
                                serviceLine.deductibleAmount = this.getNestedObject(adjudication[k], ['amount', 'value']);
                            } else 
                            if(category.indexOf('Submitted Charge') > 0 ){
                                serviceLine.submittedCharges = this.getNestedObject(adjudication[k], ['amount', 'value']);
                            } else 
                            if(category.indexOf('Allowed Charge') > 0 ){
                                serviceLine.allowedCharges = this.getNestedObject(adjudication[k], ['amount', 'value']);
                            } else
                            if(category.indexOf('Coinsurance Amount') > 0 ){
                                serviceLine.coinsurance = this.getNestedObject(adjudication[k], ['amount', 'value']);
                            }  
                        }
                    } 

                    claim.services.push(serviceLine);
                }
            }

            eobNew.claims.push(claim);
        }

        return eobNew;
    }
  
    formatEOBDetail ()  {
        let jsonData = JSON.parse(localStorage.getItem('eobJSONData'));
        let jsonParsedObject = JSON.parse(JSON.stringify(jsonData)) ;
        let eobDetail = new EOBDetail();   
        console.log("*** format EOB Detail ***");
                       
        for (var i=0; i<99; i++){
            let entry = jsonData["entry"];        
            let eobEntry = entry[i];

            this.beneId = this.getNestedObject(eobEntry, ['resource', 'patient', 'reference']) ;
            var index = this.beneId.indexOf( "/" ); 
            eobDetail.beneId = this.beneId.substr(index + 1,15);

            this.claimId = this.getNestedObject(eobEntry, ['resource', 'id']) ;
            var index = this.claimId.indexOf( "-" ); 
            eobDetail.claimId = this.claimId.substr(index + 1,10);
            if (localStorage.getItem('claimId') == this.claimId.substr(index + 1,10)){
                this.claimIndex = i;
                i = 100 
                // return eobDetail;
            } else {
                continue;
            }  
        }
            
        let entry = jsonData["entry"];              
        let eobClaimEntry = entry[this.claimIndex];   

        // status     
        eobDetail.claimStatus = this.getNestedObject(eobClaimEntry, ['resource', 'status']) ;
        //billable period - start         
        eobDetail.billablePeriodStart = this.getNestedObject(eobClaimEntry, ['resource', 'billablePeriod', 'start']) ;

        //billable period - end           
        eobDetail.billablePeriodEnd = this.getNestedObject(eobClaimEntry, ['resource', 'billablePeriod', 'end']) ;
     
        // claim id and type (i.e. carrier)                      
        this.claimId = this.getNestedObject(eobClaimEntry, ['resource', 'id']) ;
        var index = this.claimId.indexOf( "-" ); 
        eobDetail.claimId = this.claimId.substr(index + 1,10);
        eobDetail.claimType = this.claimId.substr(0,index);
               
        // claim_type_cd and claim_type_cd display                    
        eobDetail.claimTypeCd = this.getNestedObject(eobClaimEntry, ['resource', 'type', 'coding', 0, 'code']) ;          
        eobDetail.claimTypeCdDisplay = this.getNestedObject(eobClaimEntry, ['resource', 'type', 'coding', 0, 'display']) ;
        //   payment amount   
        eobDetail.paymentAmount = this.getNestedObject(eobClaimEntry, ['resource', 'payment', 'amount', 'value']) ;
        //   provider   
        eobDetail.provider = this.getNestedObject(eobClaimEntry, ['resource', 'careTeam', 0, 'provider', 'identifier', 'value']) ;
        // diagnosis Primary
        eobDetail.diagnosisPrimary = this.getNestedObject(eobClaimEntry, ['resource', 'diagnosis', 0, 'diagnosisCodeableConcept' ,'coding', 0, 'code']) ;    
    
        eobDetail.firstName = 'John'
        eobDetail.lastName = 'Doe'

        let adjudication = this.getNestedObject(eobClaimEntry, ['resource', 'item', 0, 'adjudication']) ;
     
        eobDetail.itemHcpcsCode1 = this.getNestedObject(eobClaimEntry, ['resource', 'item', 0, 'service', 'coding', 0, 'code']) ;
        eobDetail.adjudicationDisplay1 = this.getNestedObject(eobClaimEntry, ['resource', 'item', 0, 'adjudication', 3, 'category', 'coding', 0, 'display']) ;
        eobDetail.adjudicationAmount1 = this.getNestedObject(eobClaimEntry, ['resource', 'item', 0, 'adjudication', 3, 'amount', 'value']) ;
        eobDetail.adjudicationDisplay1B = this.getNestedObject(eobClaimEntry, ['resource', 'item', 0, 'adjudication', 1, 'category', 'coding', 0, 'display']) ;
        eobDetail.adjudicationAmount1B = this.getNestedObject(eobClaimEntry, ['resource', 'item', 0, 'adjudication', 1, 'amount', 'value']) ;
        eobDetail.itemMtusCode1 = this.getNestedObject(eobClaimEntry, ['resource', 'item', 0, 'extension', 0, 'valueCoding',  'code']) ;
        eobDetail.itemBetosCodeDisplay1 = this.getNestedObject(eobClaimEntry, ['resource', 'item', 0, 'extension', 2, 'valueCoding',  'display']) ;
        eobDetail.itemBetosCode1 = this.getNestedObject(eobClaimEntry, ['resource', 'item', 0, 'extension', 2, 'valueCoding',  'code']) ;

        eobDetail.adjudicationDisplay2 = this.getNestedObject(eobClaimEntry, ['resource', 'item', 1, 'adjudication', 3, 'category', 'coding', 0, 'display']) ;
        eobDetail.adjudicationAmount2 = this.getNestedObject(eobClaimEntry, ['resource', 'item', 1, 'adjudication', 3, 'amount', 'value']) ;
        eobDetail.adjudicationDisplay2B = this.getNestedObject(eobClaimEntry, ['resource', 'item', 1, 'adjudication', 1, 'category', 'coding', 0, 'display']) ;
        eobDetail.adjudicationAmount2B = this.getNestedObject(eobClaimEntry, ['resource', 'item', 1, 'adjudication', 1, 'amount', 'value']) ;
        eobDetail.itemMtusCode2 = this.getNestedObject(eobClaimEntry, ['resource', 'item', 1, 'extension', 0, 'valueCoding',  'code']) ;
        eobDetail.itemBetosCodeDisplay2 = this.getNestedObject(eobClaimEntry, ['resource', 'item', 1, 'extension', 2, 'valueCoding',  'display']) ;
        eobDetail.itemBetosCode2 = this.getNestedObject(eobClaimEntry, ['resource', 'item', 1, 'extension', 2, 'valueCoding',  'code']) ;
      
        return eobDetail;   
    }
  
    getNestedObject (nestedObj, pathArr)  {
        return pathArr.reduce((obj, key) =>
            (obj && obj[key] !== 'undefined') ? obj[key] : undefined, nestedObj);
    }
}

export let fakeBackendProvider = {
    // use fake backend in place of Http service for backend-less development
    provide: HTTP_INTERCEPTORS,
    useClass: FakeBackendInterceptor,
    multi: true
};