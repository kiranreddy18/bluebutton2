import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable()
export class JwtInterceptor implements HttpInterceptor {
    intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        // add authorization header with jwt token if available
        console.log ("*** start -  intercepting in jwtinterceptor ***");

        let currentUser = JSON.parse(localStorage.getItem('currentUser')); 
        console.log (" current user token is " + (localStorage.getItem('currentUser')));
        if(currentUser == null){
            currentUser = {};
        }

        if (currentUser && currentUser.token) {
           console.log("in jwtinterceptor with a token " + currentUser.token)
            request = request.clone({
                setHeaders: { 
                    Authorization: `Bearer ${currentUser.token}`
                }
            });
        }
        console.log ("*** complete - intercepting in jwtinterceptor ***");

        return next.handle(request);
    }
}