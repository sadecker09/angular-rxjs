import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
} from '@angular/core';
import { EMPTY } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ProductService } from '../product.service';

@Component({
  selector: 'pm-product-list',
  templateUrl: './product-list-alt.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductListAltComponent {
  constructor(private productService: ProductService) {}

  pageTitle = 'Products';
  errorMessage = '';

  products$ = this.productService.productsWithCategory$.pipe(
    catchError((err) => {
      this.errorMessage = err;
      return EMPTY;
    })
  );

  // emits the selected product each time it changes
  selectedProduct$ = this.productService.selectedProduct$;

  onSelected(productId: number): void {
    this.productService.selectedProductChanged(productId);
  }
}
