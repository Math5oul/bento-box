import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LoginModalComponent } from './login-modal.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('LoginModalComponent', () => {
  let component: LoginModalComponent;
  let fixture: ComponentFixture<LoginModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoginModalComponent, HttpClientTestingModule],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
