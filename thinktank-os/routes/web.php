<?php

use App\Http\Controllers\ManuscriptController;
use App\Http\Controllers\PortfolioMatrixController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\StoreController;
use App\Http\Controllers\VanguardLibraryController;
use Illuminate\Support\Facades\Route;

// Public Institutional Vanguard Library & Foundational Thesis
Route::get('/', [VanguardLibraryController::class, 'index'])->name('home');
Route::get('/library', [VanguardLibraryController::class, 'index'])->name('library.index');
Route::get('/briefs/{manuscript}', [VanguardLibraryController::class, 'show'])->name('briefs.show');
Route::get('/thesis', [VanguardLibraryController::class, 'thesis'])->name('thesis.index');

// The Economic Engine (Commercial Monetization & Executive Salons)
Route::get('/store', [StoreController::class, 'index'])->name('store.index');
Route::post('/store/checkout/intent', [StoreController::class, 'createPaymentIntent'])->name('store.intent');
Route::post('/store/checkout/confirm', [StoreController::class, 'confirmOrder'])->name('store.confirm');
Route::post('/store/webhook', [StoreController::class, 'webhook'])->name('store.webhook');

Route::get('/dashboard', [PortfolioMatrixController::class, 'index'])
    ->middleware(['auth', 'verified'])
    ->name('dashboard');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    // Institutional Portfolio Matrix
    Route::get('/matrix', [PortfolioMatrixController::class, 'index'])->name('matrix.index');
    Route::get('/matrix/manuscripts/{manuscript}', [PortfolioMatrixController::class, 'show'])->name('matrix.show');
    Route::patch('/matrix/manuscripts/{manuscript}/status', [PortfolioMatrixController::class, 'updateStatus'])->name('matrix.updateStatus');
    Route::patch('/matrix/manuscripts/{manuscript}/content', [PortfolioMatrixController::class, 'updateContent'])->name('matrix.updateContent');

    // Manuscript Ingestion Dropzone
    Route::get('/manuscripts/intake', [ManuscriptController::class, 'create'])->name('manuscripts.create');
    Route::post('/manuscripts/intake', [ManuscriptController::class, 'store'])->name('manuscripts.store');
    Route::get('/manuscripts', [ManuscriptController::class, 'index'])->name('manuscripts.index');
});

require __DIR__.'/auth.php';
