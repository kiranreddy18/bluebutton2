import { AuthToken } from "../app.component";
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, tap, catchError } from 'rxjs/operators';

import { HttpParams } from "@angular/common/http";
import { HttpHeaders } from "@angular/common/http";
import { Router, ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';
import { User } from '../_models';
import { EOB} from '../_models';
import { OAuthAttributes } from '../_models';
import { HttpRequest, HttpResponse, HttpHandler, HttpEvent, HttpInterceptor, HTTP_INTERCEPTORS } from '@angular/common/http';
import { of, throwError } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthenticationService {

    private oauthAttrs : OAuthAttributes = new OAuthAttributes();

    constructor(private http: HttpClient) { }

    login(username: string, password: string) {
        return this.http.post<any>('/api/authenticate', { username: username, password: password })
            .pipe(map((res:any) => {
                // login successful if there's a jwt token in the response
                if (res && res.token) {
                    // store username and jwt token in local storage to keep user logged in between page refreshes
                    localStorage.setItem('currentUser', JSON.stringify({ username, token: res.token }));
                }
            }));
    }

    authorizeWithBlueButton(){
        var headers = new HttpHeaders().set('Content-Type', 'application/x-www-form-urlencoded');   
        let urlSearchParams = new URLSearchParams();
        urlSearchParams.set('grant_type', this.oauthAttrs.grant_type);
        urlSearchParams.set('redirect_uri', this.oauthAttrs.redirect_uri);
        urlSearchParams.set('client_id', this.oauthAttrs.client_id);
        urlSearchParams.set('client_secret', this.oauthAttrs.client_secret);
        urlSearchParams.set('state', this.oauthAttrs.state);
        
        let body = urlSearchParams.toString();

        return this.http.post<any>('https://sandbox.bluebutton.cms.gov/v1/o/authorize/?' + body, {headers, HttpHeaders}, )
                    .pipe(
                        tap(data => console.log('got token from auth service')),
                        catchError(this.handleError('getBlueButtonToken', []))
                    );             
    }

    getBlueButtonToken(code:string){

        var headers = new HttpHeaders().set('Content-Type', 'application/x-www-form-urlencoded');

        let urlSearchParams = new URLSearchParams();
        urlSearchParams.set('grant_type', this.oauthAttrs.grant_type);
        urlSearchParams.set('redirect_uri', this.oauthAttrs.redirect_uri);
        urlSearchParams.set('client_id', this.oauthAttrs.client_id);
        urlSearchParams.set('client_secret', this.oauthAttrs.client_secret);
        urlSearchParams.set('state', this.oauthAttrs.state);
        urlSearchParams.set('code', code);

        let body = urlSearchParams.toString();
        
        return this.http.post<AuthToken>('https://sandbox.bluebutton.cms.gov/v1/o/token/?' + body, {headers, HttpHeaders}, )
                    .pipe(
                        tap(data => console.log('got token from auth service')),
                        catchError(this.handleError('getBlueButtonToken', []))
                    );

    }
  
    getBlueButtonToken2(username: string, password: string, code: string, router: Router) {
   
        var headers = new HttpHeaders().set('Content-Type', 'application/x-www-form-urlencoded');

        let urlSearchParams = new URLSearchParams();
        urlSearchParams.set('grant_type', this.oauthAttrs.grant_type);
        urlSearchParams.set('redirect_uri', this.oauthAttrs.redirect_uri);
        urlSearchParams.set('client_id', this.oauthAttrs.client_id);
        urlSearchParams.set('client_secret', this.oauthAttrs.client_secret);
        urlSearchParams.set('state', this.oauthAttrs.state);
        urlSearchParams.set('code', code);

        let body = urlSearchParams.toString();
        
        return this.http.post<AuthToken>('https://sandbox.bluebutton.cms.gov/v1/o/token/?' + body, {headers, HttpHeaders}, )
                    .pipe(
                        tap(data => console.log('got token from auth service')),
                        catchError(this.handleError('getBlueButtonToken', []))
                    );
   
    }

    getEOBData(url : string){
        return this.http.get<any>(url)
                    .pipe(
                        tap(data => console.log('got eob data')),
                        catchError(this.handleError('getEOBData', []))
                    );        
    }

    getEOBJSON(startIndex : number){
        var initialURL = "https://sandbox.bluebutton.cms.gov/v1/fhir/ExplanationOfBenefit/?startIndex="+startIndex;
        return this.getEOBData(initialURL);
    }

    getPatient(url : string){
        return this.http.get<any>(url)
                    .pipe(
                        tap(data => console.log('got patient data')),
                        catchError(this.handleError('getPatient', []))
                    ); 
    }

    getPatientById(patientId : string){
        var initialURL = "https://sandbox.bluebutton.cms.gov/v1/fhir/Patient/"+patientId;
        return this.getPatient(initialURL);
    }

    getPatientJSON(){
        var initialURL = "https://sandbox.bluebutton.cms.gov/v1/fhir/Patient/";
        return this.getPatient(initialURL);
    }

    getClaimByURL(url : string) {
        return this.http.get<any>(url)
                    .pipe(
                        tap(data => console.log('got claim data')),
                        catchError(this.handleError('getClaimByURL', []))
                    );        
    }

    getCoverageByPatientId(patientId : string){
        var initialURL = "https://sandbox.bluebutton.cms.gov/v1/fhir/Coverage/?_format=application%2Fjson%2Bfhir&startIndex=0&_count=10&beneficiary=Patient%2F"+patientId;
        return this.http.get<any>(initialURL)
                    .pipe(
                        tap(data => console.log('got coverage data')),
                        catchError(this.handleError('getCoverageByPatientId', []))
                    );              
    }

    private handleError<T>(operation = 'operation', result?: T){
        return (error:any) : Observable<T> => {
            console.error(error + ' in operation : ' + operation);
            return of(result as T);
        }
    }
  
    logout() {
        // remove user from local storage to log user out
        localStorage.removeItem('currentUser');
    }
}