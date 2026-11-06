<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Vision checks (letter chart, reading, contrast), one row per test and eye.
        // "score" is the main number: logMAR for acuity and reading (lower = better),
        // logCS for contrast (higher = better). Line-by-line details are in "data".
        Schema::create('vision_tests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('type', 20);
            $table->string('eye', 10);
            $table->date('date');
            $table->unsignedSmallInteger('distance_cm');
            $table->decimal('score', 6, 3);
            $table->json('data');
            $table->text('note')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'type', 'eye', 'date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('vision_tests');
    }
};
