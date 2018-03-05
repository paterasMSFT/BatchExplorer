import { Component, DebugElement, NO_ERRORS_SCHEMA } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import { List } from "immutable";
import { Observable } from "rxjs";

import { MaterialModule } from "@batch-flask/core";
import { ButtonComponent } from "@batch-flask/ui/buttons";
import { RoleAssignment, RoleDefinition } from "app/models";
import { AuthorizationHttpService, ResourceAccessService } from "app/services";
import { click } from "test/utils/helpers";
import { ResourcePermissionButtonComponent } from "./resource-permission-button.component";

const contributorRole = new RoleDefinition({
    id: "roleDefinitions/contributor",
    properties: { roleName: "Contributor" },
} as any);

const readerRole = new RoleDefinition({
    id: "roleDefinitions/contributor",
    properties: { roleName: "Reader" },
} as any);

const customRole = new RoleDefinition({
    id: "roleDefinitions/contributor",
    properties: { roleName: "Custom role" },
} as any);

@Component({
    template: `
        <bl-resource-permission-button [resourceId]="resourceId" [principalId]="principalId">
        </bl-resource-permission-button>
    `,
})
class TestComponent {
    public resourceId = "resource-1";
    public principalId = null;
}

describe("ResourcePermissionButtonComponenent", () => {
    let fixture: ComponentFixture<TestComponent>;
    let testComponent: TestComponent;
    let component: ResourcePermissionButtonComponent;
    let de: DebugElement;
    let buttonEl: DebugElement;
    let buttonComponent: ButtonComponent;
    let resourceAccessServiceSpy;
    let currentRole: { role: RoleDefinition, roleAssignment: RoleAssignment };

    beforeEach(() => {
        resourceAccessServiceSpy = {
            getRoleFor: jasmine.createSpy("getRoleFor").and.callFake(() => Observable.of(currentRole)),
            listRoleDefinitions: () => Observable.of([contributorRole, readerRole, customRole]),
        };
        TestBed.configureTestingModule({
            imports: [MaterialModule],
            declarations: [ButtonComponent, ResourcePermissionButtonComponent, TestComponent],
            providers: [
                { provide: AuthorizationHttpService, useValue: null },
                { provide: ResourceAccessService, useValue: resourceAccessServiceSpy },
            ],
            schemas: [NO_ERRORS_SCHEMA],
        });
        fixture = TestBed.createComponent(TestComponent);
        testComponent = fixture.componentInstance;
        de = fixture.debugElement.query(By.css("bl-resource-permission-button"));
        component = de.componentInstance;
        buttonEl = de.query(By.css("bl-button"));
        buttonComponent = buttonEl.componentInstance;
        fixture.detectChanges();
    });

    describe("when principal doesn't have permission", () => {
        beforeEach(() => {
            currentRole = { role: null, roleAssignment: null };
            testComponent.principalId = "principal-1";
            fixture.detectChanges();
        });

        it("should show none", () => {
            expect(buttonEl.nativeElement.textContent).toContain("None");
        });

        it("button color should be danger", () => {
            expect(buttonComponent.color).toEqual("danger");
        });
    });

    describe("when principal has a role", () => {
        beforeEach(() => {
            currentRole = { role: contributorRole, roleAssignment: null };
            testComponent.principalId = "principal-1";
            fixture.detectChanges();
        });

        it("should show the rolename", () => {
            expect(buttonEl.nativeElement.textContent).toContain("Contributor");
        });

        it("button color should be primary", () => {
            expect(buttonComponent.color).toEqual("primary");
        });
    });

    describe("when clicking on button", () => {
        beforeEach(() => {
            click(buttonEl);
            fixture.detectChanges();
        });

        it("should list only contributor and read roles", () => {
            const roles = List<RoleDefinition>(component.availableRoles);
            expect(roles.size).toBe(2);
            expect(roles.get(0).properties.roleName).toEqual("Contributor");
            expect(roles.get(1).properties.roleName).toEqual("Reader");
        });
    });
});